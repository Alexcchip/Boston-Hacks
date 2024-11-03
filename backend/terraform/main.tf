

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
    allowed_origins = ["*"]
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

# Generate a key pair for SSH access
resource "tls_private_key" "my_key" {
  algorithm = "RSA"
  rsa_bits  = 2048
}

resource "aws_key_pair" "ec2_key_pair" {
  key_name   = "my-key-pair"
  public_key = tls_private_key.my_key.public_key_openssh
}

# Save the private key locally
output "private_key" {
  value     = tls_private_key.my_key.private_key_pem
  sensitive = true  # Marks this output as sensitive, hiding it in the CLI output
}

# Create an EC2 instance for hosting the API server
resource "aws_instance" "api_server" {
  ami                  = "ami-007868005aea67c54"  # Replace with a valid Amazon Linux AMI ID
  instance_type        = "t3.micro"
  iam_instance_profile = aws_iam_instance_profile.ec2_s3_instance_profile.name
  security_groups      = [aws_security_group.api_sg.name]
  key_name             = aws_key_pair.ec2_key_pair.key_name


  user_data = <<-EOF
            #!/bin/bash
            # Update the server
            yum update -y

            # Install Git and other prerequisites
            yum install -y git

            # Clone the repository
            mkdir -p /var/www
            cd /var/www
            git clone https://github.com/Alexcchip/Boston-Hacks.git
            cd Boston-Hacks
            git checkout prodbranch
            git pull

            # Install Python 3.8 and set up virtual environment
            amazon-linux-extras enable python3.8
            yum install -y python3.8 python3.8-venv python3-pip
            python3.8 -m venv /var/www/Boston-Hacks/backend/venv

            # Activate virtual environment and install backend dependencies
            source /var/www/Boston-Hacks/backend/venv/bin/activate
            cd /var/www/Boston-Hacks/backend
            pip install --upgrade pip
            pip install -r requirements.txt

            # Run Gunicorn for the Flask app
            /var/www/Boston-Hacks/backend/venv/bin/gunicorn -w 4 -b 127.0.0.1:5000 app:app --daemon

            # Install Node.js, npm, and build frontend
            curl -sL https://rpm.nodesource.com/setup_16.x | bash -
            yum install -y nodejs
            cd /var/www/Boston-Hacks/frontend
            npm install
            npm run build

            # Install and configure Nginx
            amazon-linux-extras install nginx1 -y
            systemctl start nginx
            systemctl enable nginx

            # Copy frontend build files to Nginx html directory
            cp -r /var/www/Boston-Hacks/frontend/build/* /usr/share/nginx/html/

            # Configure Nginx to serve the backend at /api and frontend from the root
            cat > /etc/nginx/nginx.conf <<EOL
            events {}
            http {
                include /etc/nginx/mime.types;
                server {
                    listen 80;
                    server_name snapstronaut.tech;

                    # Redirect HTTP to HTTPS
                    return 301 https://$host$request_uri;
                }

                server {
                    listen 443 ssl;
                    server_name snapstronaut.tech;

                    # SSL certificate configuration (managed by Certbot)
                    ssl_certificate /etc/letsencrypt/live/snapstronaut.tech/fullchain.pem;
                    ssl_certificate_key /etc/letsencrypt/live/snapstronaut.tech/privkey.pem;

                    # Serve the frontend build
                    location / {
                        root /usr/share/nginx/html;
                        try_files $uri /index.html;
                    }

                    # Proxy requests to the backend
                    location /api {
                        proxy_pass http://127.0.0.1:5000;
                        proxy_set_header Host $host;
                        proxy_set_header X-Real-IP $remote_addr;
                        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                        proxy_set_header X-Forwarded-Proto $scheme;
                    }
                }
            }
            EOL

            # Install Certbot and request SSL certificate
            amazon-linux-extras install epel -y
            yum install -y certbot
            /usr/local/bin/pip3 install certbot-nginx

            # Request SSL certificate
            certbot --nginx -d snapstronaut.tech --non-interactive --agree-tos -m shoreibah.n@northeastern.edu

            # Set up a cron job for auto-renewing the certificate
            echo "0 0 * * * /usr/bin/certbot renew --quiet" | crontab -

            # Restart Nginx to apply the configuration
            systemctl restart nginx
EOF

}


# Security group for the EC2 instance
resource "aws_security_group" "api_sg" {
  name = "api-security-group"

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

  # Allow SSH access from anywhere (0.0.0.0/0)
  # For better security, replace "0.0.0.0/0" with your specific IP range
  ingress {
    from_port   = 22
    to_port     = 22
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
