# Define the AWS provider
provider "aws" {
  region = "us-east-1"  
}


# Create S3 bucket for storing images
resource "aws_s3_bucket" "astronaut_images" {
  bucket = "astronaut-app-images-bucket"

  # Optional: Configure bucket versioning
  versioning {
    enabled = true
  }

  # CORS configuration (optional)
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE"]
    allowed_origins = ["http://localhost:3000"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# Public Access Block configuration
resource "aws_s3_bucket_public_access_block" "astronaut_images_public_access_block" {
  bucket                  = aws_s3_bucket.astronaut_images.id
  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = false
  restrict_public_buckets = false
}

# Bucket Policy for public read access
resource "aws_s3_bucket_policy" "astronaut_images_policy" {
  bucket = aws_s3_bucket.astronaut_images.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = "*",
        Action   = "s3:GetObject",
        Resource = "${aws_s3_bucket.astronaut_images.arn}/*"
      }
    ]
  })
}

# IAM Role for EC2 instance to access S3
resource "aws_iam_role" "ec2_s3_role" {
  name = "EC2S3AccessRole"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow",
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

# IAM Policy to allow EC2 access to S3
resource "aws_iam_policy" "s3_access_policy" {
  name        = "S3AccessPolicy"
  description = "Policy for EC2 to access S3 bucket"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ],
        Resource = [
          "${aws_s3_bucket.astronaut_images.arn}",
          "${aws_s3_bucket.astronaut_images.arn}/*"
        ]
      }
    ]
  })
}

# Attach the policy to the role
resource "aws_iam_role_policy_attachment" "attach_s3_policy_to_ec2_role" {
  role       = aws_iam_role.ec2_s3_role.name
  policy_arn = aws_iam_policy.s3_access_policy.arn
}

# IAM Instance Profile to attach the IAM role to EC2
resource "aws_iam_instance_profile" "ec2_s3_instance_profile" {
  name = "EC2S3InstanceProfile"
  role = aws_iam_role.ec2_s3_role.name
}

# Create an EC2 instance for hosting the API server
resource "aws_instance" "api_server" {
  ami                  = "ami-007868005aea67c54"  # Replace with a valid Amazon Linux AMI ID
  instance_type        = "t3.micro"
  iam_instance_profile = aws_iam_instance_profile.ec2_s3_instance_profile.name

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


# Create an RDS instance for the relational database
resource "aws_db_instance" "astronaut_db" {
  identifier       = "astronaut-db"
  engine           = "postgres"
  instance_class   = "db.t3.micro"
  allocated_storage = 20
  username         = "dbadmin"
  publicly_accessible    = true
  password         = var.db_password  # Securely pulls from the environment
  skip_final_snapshot = true
}
