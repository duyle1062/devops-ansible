provider "aws" {
  region = "us-east-1"
}

resource "aws_security_group" "web_sg" {
  name = "web-sg-terraform"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
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

resource "aws_instance" "web" {
  ami           = "ami-0c02fb55956c7d316" # Ubuntu (us-east-1)
  instance_type = "t2.micro"

  key_name = "NT132-keypair-EC2"

  root_block_device {
    volume_size = 16   
    volume_type = "gp3"
  }

  vpc_security_group_ids = [aws_security_group.web_sg.id]

  tags = {
    Name = "devops-terraform"
  }
}

output "public_ip" {
  value = aws_instance.web.public_ip
}
