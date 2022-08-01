#cloud-config
# vim: syntax=yaml
ssh_pwauth: True
disable_root: false
chpasswd:
  list: |
    swiftycareer:swiftycareer
  expire: false
growpart:
  mode: auto
  devices: ['/']

hostname: ${host_name}
manage_etc_hosts: true
users:
  - name: swiftycareer
    sudo: ALL=(ALL) NOPASSWD:ALL
    ssh_authorized_keys:
      - ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC05UXRJWumDWzFKiEWgMi8sqGOJJpf6nhHjqhA/DuAF7q1586Az2yB00ZLzbdWfh3dyzjCKfWpfIX9eR61vmuDvsTNm1scJi39J63NpJ3B0y1+W84k22ZerbrmwRHWytfgT5zxoVQnJ60WcGJ/17TPk5u6gEJKfqK8l585weapX8d9CBySSxlEPGhqTrOB+cQ7COYryeUdRwnr2M9Rfd9sjEYeJtJktr7yiWtgNOJlBty6X0eK6GctmjZZBf9ToGdYRUz6hThRVz77AzRr59Sso9Rn3YKxrK5LmeJbZfNGQRCz0Mg37Bp/r1uME4w8z6stGuQBM161URA8E28EkNAxclzc7YhieTFit92sUOm8hVmFWzJvxI0ootz+9Wnw1V3262WNMAHfKKy/nN4++WzavlYic2nF4T3CXpKSlWAK479oGCGqjQpE3oqR2ltSZAKgEyVtd/085CB3D74EeDeCKMTqjZzLumJceV+FmwYODXJdOwh6Nt91xpKalSstjFU= gellert@gellert-ubuntu-server #Chageme
    shell: /bin/bash
    groups: wheel