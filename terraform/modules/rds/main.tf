terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

# Generate random password for RDS master user
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Security group for RDS
resource "aws_security_group" "rds" {
  name_prefix = "${var.cluster_name}-rds-"
  description = "Security group for RDS database"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = var.allowed_security_groups
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.cluster_name}-rds-sg"
  }
}

# RDS Subnet Group
resource "aws_db_subnet_group" "default" {
  name_prefix = "${var.cluster_name}-"
  subnet_ids  = var.database_subnet_ids

  tags = {
    Name = "${var.cluster_name}-db-subnet-group"
  }
}

# RDS Instance
resource "aws_db_instance" "postgres" {
  identifier            = "${var.cluster_name}-postgres"
  engine                = "postgres"
  engine_version        = var.engine_version
  instance_class        = var.instance_class
  allocated_storage     = var.allocated_storage
  storage_type          = var.storage_type
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.rds.arn

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db_password.result

  db_subnet_group_name            = aws_db_subnet_group.default.name
  vpc_security_group_ids          = [aws_security_group.rds.id]
  publicly_accessible             = false
  multi_az                         = true
  backup_retention_period          = 7
  backup_window                    = "03:00-04:00"
  maintenance_window               = "sun:04:00-sun:05:00"
  copy_tags_to_snapshot            = true
  delete_automated_backups         = false
  deletion_protection              = false
  enabled_cloudwatch_logs_exports  = ["postgresql"]
  skip_final_snapshot              = false
  final_snapshot_identifier        = "${var.cluster_name}-postgres-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  performance_insights_enabled      = true
  performance_insights_kms_key_id   = aws_kms_key.rds.arn

  tags = {
    Name        = "${var.cluster_name}-postgres"
    Environment = var.environment
    Project     = var.project_name
  }
}

# KMS key for RDS encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption (${var.cluster_name})"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Name = "${var.cluster_name}-rds-key"
  }
}

resource "aws_kms_alias" "rds" {
  name          = "alias/${var.cluster_name}-rds"
  target_key_id = aws_kms_key.rds.key_id
}

# Secrets Manager secret for database credentials
resource "aws_secretsmanager_secret" "db_credentials" {
  name_prefix             = "${var.cluster_name}-db-credentials-"
  description             = "RDS database credentials for ${var.cluster_name}"
  recovery_window_in_days = 7

  tags = {
    Name = "${var.cluster_name}-db-credentials"
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = aws_db_instance.postgres.username
    password = aws_db_instance.postgres.password
    engine   = "postgres"
    host     = aws_db_instance.postgres.endpoint
    port     = 5432
    dbname   = aws_db_instance.postgres.db_name
  })
}
