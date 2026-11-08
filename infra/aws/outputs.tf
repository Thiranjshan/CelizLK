output "public_ip" {
  description = "Elastic IP address for the A record; DNS is not changed by Terraform."
  value       = aws_eip.celiz.public_ip
}

output "instance_id" {
  description = "EC2 instance ID for the GitHub Actions EC2_INSTANCE_ID repository variable."
  value       = aws_instance.celiz.id
}

output "availability_zone" {
  description = "Availability zone containing the EC2 instance and persistent data volume."
  value       = local.availability_zone
}


