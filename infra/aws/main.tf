terraform {
  required_version = ">= 1.10.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.80, < 7.0"
    }
  }

}

provider "aws" {
  region = var.aws_region
}

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
}

locals {
  availability_zone = data.aws_availability_zones.available.names[0]
  data_device_id    = replace(aws_ebs_volume.data.id, "-", "")
}

resource "aws_vpc" "celiz" {
  cidr_block           = "10.42.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "celiz-aws"
  }
}

resource "aws_internet_gateway" "celiz" {
  vpc_id = aws_vpc.celiz.id

  tags = {
    Name = "celiz-aws"
  }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.celiz.id
  cidr_block              = "10.42.1.0/24"
  availability_zone       = local.availability_zone
  map_public_ip_on_launch = true

  tags = {
    Name = "celiz-aws-public"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.celiz.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.celiz.id
  }

  tags = {
    Name = "celiz-aws-public"
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

resource "aws_security_group" "instance" {
  name        = "celiz-aws-instance"
  description = "Public web traffic; optional SSH limited to the configured administrator CIDR."
  vpc_id      = aws_vpc.celiz.id

  ingress {
    description = "HTTP for Caddy ACME and redirect"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS storefront"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  dynamic "ingress" {
    for_each = var.ssh_ingress_cidr == "" ? [] : [var.ssh_ingress_cidr]
    content {
      description = "SSH from configured administrator CIDR only"
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "celiz-aws-instance"
  }
}

resource "aws_iam_role" "instance" {
  name = "celiz-aws-ec2"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.instance.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "instance" {
  name = "celiz-aws-ec2"
  role = aws_iam_role.instance.name
}

resource "aws_ebs_volume" "data" {
  availability_zone = local.availability_zone
  size              = var.data_volume_size_gib
  type              = "gp3"
  encrypted         = true

  lifecycle {
    prevent_destroy = true
  }

  tags = {
    Name = "celiz-aws-data"
  }
}

resource "aws_instance" "celiz" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.public.id
  vpc_security_group_ids      = [aws_security_group.instance.id]
  iam_instance_profile        = aws_iam_instance_profile.instance.name
  key_name                    = var.ssh_public_key == "" ? null : aws_key_pair.admin[0].key_name
  associate_public_ip_address = true
  user_data = templatefile("${path.module}/templates/user-data.sh.tftpl", {
    data_device_id         = local.data_device_id
    backup_retention_days  = var.backup_retention_days
    postgres_backup_script = base64gzip(file("${path.module}/../../scripts/aws/backup-postgres.sh"))
    uploads_backup_script  = base64gzip(file("${path.module}/../../scripts/aws/backup-uploads.sh"))
    deploy_script          = base64gzip(file("${path.module}/../../scripts/aws/deploy-ec2.sh"))
    postgres_service       = base64gzip(file("${path.module}/systemd/celiz-backup-postgres.service"))
    postgres_timer         = base64gzip(file("${path.module}/systemd/celiz-backup-postgres.timer"))
    uploads_service        = base64gzip(file("${path.module}/systemd/celiz-backup-uploads.service"))
    uploads_timer          = base64gzip(file("${path.module}/systemd/celiz-backup-uploads.timer"))
  })
  user_data_replace_on_change = false

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  root_block_device {
    volume_type           = "gp3"
    volume_size           = var.root_volume_size_gib
    encrypted             = true
    delete_on_termination = true
  }

  lifecycle {
    ignore_changes = [ami, user_data]
  }

  tags = {
    Name = "celiz-aws"
  }
}

resource "aws_key_pair" "admin" {
  count      = var.ssh_public_key == "" ? 0 : 1
  key_name   = "celiz-aws-admin"
  public_key = var.ssh_public_key

  tags = {
    Name = "celiz-aws-admin"
  }
}

resource "aws_volume_attachment" "data" {
  device_name                    = "/dev/sdf"
  volume_id                      = aws_ebs_volume.data.id
  instance_id                    = aws_instance.celiz.id
  skip_destroy                   = false
  stop_instance_before_detaching = true
}

resource "aws_eip" "celiz" {
  domain   = "vpc"
  instance = aws_instance.celiz.id

  tags = {
    Name = "celiz-aws"
  }
}
