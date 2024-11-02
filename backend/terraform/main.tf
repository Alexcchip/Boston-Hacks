# Define the AWS provider
provider "aws" {
  region = "us-east-1"  # Set your preferred AWS region
}

# Create an S3 bucket for storing images
resource "aws_s3_bucket" "astronaut_images" {
  bucket = "astronaut-app-images-bucket"
  acl    = "private"

  # Optional: Configure bucket versioning
  versioning {
    enabled = true
  }
}

# Create an RDS instance for the relational database
resource "aws_db_instance" "astronaut_db" {
  identifier       = "astronaut-db"
  engine           = "postgres"
  instance_class   = "db.t3.micro"
  allocated_storage = 20
  username         = "dbadmin"
  password         = var.db_password  # Securely pulls from the environment
  skip_final_snapshot = true
}

# Create an EC2 instance for hosting the API server
resource "aws_instance" "api_server" {
  ami           = "ami-007868005aea67c54"  # Replace with the latest Amazon Linux AMI ID
  instance_type = "t3.micro"

  # Security group for EC2 to allow HTTP/HTTPS access
  security_groups = [aws_security_group.api_sg.name]

  # User data for bootstrapping the server (optional)
  user_data = <<-EOF
              #!/bin/bash
              yum update -y
              # Install necessary packages and start your server
              EOF
}

# Security group for the EC2 instance
resource "aws_security_group" "api_sg" {
  name        = "api-security-group"

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
