# make sure virsh pool-list has default pool
# if not, run $ mkdir -p /kvm/pools/homelab
# $ virsh pool-define-as --name default --type dir --target /kvm/pools/homelab
# virsh pool-autostart default
# virsh pool-start default
# On Ubuntu distros SELinux is enforced by qemu even if it is disabled globally, 
# this might cause unexpected `Could not open '/var/lib/libvirt/images/<FILE_NAME>': Permission denied` errors. 
# Double check that `security_driver = "none"` is uncommented in `/etc/libvirt/qemu.conf` and issue `sudo systemctl restart libvirt-bin` to restart the daemon.


terraform {
  required_providers {
    libvirt = {
      source = "dmacvicar/libvirt"
    }
  }
}

provider "libvirt" {
  ## Configuration options
  uri = "qemu:///system"
  #alias = "server2"
  #uri   = "qemu+ssh://root@192.168.100.10/system"
}