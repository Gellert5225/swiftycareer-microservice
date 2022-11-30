# Defining VM Volume
resource "libvirt_volume" "swiftycareer-k8s-cluster" {
  count   = var.hosts
  name    = "${var.nodes[count.index]}"
  pool    = "default" # List storage pools using virsh pool-list
  source  = "https://cloud-images.ubuntu.com/releases/server/22.04/release-20221117/ubuntu-22.04-server-cloudimg-amd64.img"
  format  = "qcow2"
}

resource "libvirt_volume" "swiftycareer-k8s-cluster-resized" {
  count   = var.hosts
  name    = "${var.nodes[count.index]}-resized"
  base_volume_id = element(libvirt_volume.swiftycareer-k8s-cluster.*.id, count.index)
  pool           = "default"
  size           = 5361393152 * 2
}

# Use CloudInit to add the instance
resource "libvirt_cloudinit_disk" "commoninit" {
  count = var.hosts
  name  = "commoninit-${var.nodes[count.index]}.iso"
  pool  = "default"

  user_data = templatefile("${path.module}/configs/cloud_init.tpl", { 
    host_name = var.nodes[count.index] 
  })

  network_config = templatefile("${path.module}/configs/network_config.tpl", {
    interface = var.interface
    ip_addr   = var.ips[count.index]
    mac_addr  = var.macs[count.index]
  })
}

# Define KVM domain to create
resource "libvirt_domain" "domain-swiftycareer-k8s" {
  count  = var.hosts
  name   = var.nodes[count.index]
  memory = var.memory
  vcpu   = count.index == 0 ? 2 : var.vcpu

  cloudinit = element(libvirt_cloudinit_disk.commoninit.*.id, count.index)

  connection {
    type     = "ssh"
    user     = "swiftycareer"
    password = "swiftycareer"
    host     = var.ips[count.index]
  }

  provisioner "file" {
    source      = count.index == 0 ? "master-script.sh" : "script.sh"
    destination = "/tmp/script.sh"
  }

  provisioner "file" {
    source      = "../deployments"
    destination = "/home/swiftycareer/deployments"
  }

  provisioner "remote-exec" {
    inline = [
      "chmod +x /tmp/script.sh",
      "yes Y | /tmp/script.sh",
    ]
  }

  network_interface {
    network_name = "default"
    addresses    = [var.ips[count.index]]
    mac          = var.macs[count.index]
  }

  disk {
    volume_id = element(libvirt_volume.swiftycareer-k8s-cluster-resized.*.id, count.index)
  }

  console {
    type        = "pty"
    target_port = "0"
    target_type = "serial"
  }

  console {
    type        = "pty"
    target_port = "1"
    target_type = "virtio"
  }

  graphics {
    type        = "spice"
    listen_type = "address"
    autoport    = true
  }
}

# Output Server IP
output "ips" {
  # show IP, run 'terraform refresh' if not populated
  value = libvirt_domain.domain-swiftycareer-k8s.*.network_interface.0.addresses
}