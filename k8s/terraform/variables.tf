variable "hosts" {
  type = number
  default = 3
}

variable "interface" {
  type = string
  default = "ens01"
}

variable "memory" {
  type = number
  default = 2048
}

variable "vcpu" {
  type = number
  default = 1
}

variable "nodes" {
  type = list
  default = ["master", "worker-1", "worker-2"]
}

variable "ips" {
  type = list
  default = ["192.168.122.11", "192.168.122.22", "192.168.122.33"]
}

variable "macs" {
  type = list
  default = ["52:54:00:50:99:c5", "52:54:00:0e:87:be", "52:54:00:9d:90:38"]
}