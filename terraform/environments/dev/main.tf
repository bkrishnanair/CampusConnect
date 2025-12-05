terraform {
  required_version = ">= 1.9"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
  }

  backend "s3" {
    bucket         = "campus-events-terraform-state"
    key            = "dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
    }
  }
}

provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
  token                  = data.aws_eks_cluster_auth.cluster.token
}

provider "helm" {
  kubernetes {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
    token                  = data.aws_eks_cluster_auth.cluster.token
  }
}

data "aws_eks_cluster_auth" "cluster" {
  name = module.eks.cluster_name
}

locals {
  cluster_name = "${var.project_name}-${var.environment}"
}

# VPC Module
module "vpc" {
  source = "../../modules/vpc"

  cluster_name      = local.cluster_name
  cidr              = var.vpc_cidr
  azs               = var.availability_zones
  public_subnets   = var.public_subnets
  private_subnets  = var.private_subnets
  database_subnets = var.database_subnets
  
  environment = var.environment
  project_name = var.project_name
}

# EKS Module
module "eks" {
  source = "../../modules/eks"

  cluster_name             = local.cluster_name
  cluster_version          = var.eks_version
  vpc_id                   = module.vpc.vpc_id
  subnet_ids               = module.vpc.private_subnets
  
  environment = var.environment
  project_name = var.project_name

  depends_on = [module.vpc]
}

# RDS Module
module "rds" {
  source = "../../modules/rds"

  cluster_name    = local.cluster_name
  engine_version  = var.rds_engine_version
  instance_class  = var.rds_instance_class
  allocated_storage = var.rds_allocated_storage
  storage_type    = var.rds_storage_type
  db_name         = var.rds_db_name
  db_username     = var.rds_username
  
  vpc_id                  = module.vpc.vpc_id
  database_subnet_ids     = module.vpc.database_subnets
  allowed_security_groups = [module.eks.cluster_security_group_id]
  
  environment = var.environment
  project_name = var.project_name

  depends_on = [module.vpc]
}

# Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = module.rds.rds_endpoint
  sensitive   = true
}

output "rds_database_name" {
  description = "RDS database name"
  value       = module.rds.rds_database_name
}
