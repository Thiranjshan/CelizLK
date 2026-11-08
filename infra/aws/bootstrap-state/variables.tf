variable "aws_region" {
  description = "AWS region for the Terraform state bucket."
  type        = string
  default     = "ap-south-1"
}

variable "state_bucket_name" {
  description = "Globally unique S3 bucket name dedicated to Celiz AWS Terraform state."
  type        = string
}
