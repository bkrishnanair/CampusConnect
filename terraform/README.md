# CampusConnect Terraform Configuration

This directory contains the complete Terraform Infrastructure-as-Code (IaC) for deploying the CampusConnect microservices platform on AWS.

## Directory Structure

```
terraform/
├── environments/
│   └── dev/                    # Development environment
│       ├── main.tf             # Root module calling other modules
│       ├── variables.tf        # Input variables
│       ├── terraform.tfvars    # Variable values (create from example)
│       └── outputs.tf          # Output values
├── modules/
│   ├── vpc/                    # VPC module
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── eks/                    # EKS Kubernetes cluster module
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── rds/                    # RDS PostgreSQL database module
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
└── README.md                   # This file
```

## Prerequisites

1. **Terraform**: >= 1.9
2. **AWS CLI**: Configured with appropriate credentials
3. **kubectl**: For interacting with EKS clusters
4. **AWS Account**: With appropriate permissions to create:
   - VPC, subnets, NAT gateways
   - EKS cluster and managed node groups
   - RDS instance
   - Security groups, KMS keys
   - S3 bucket and DynamoDB table for state management

## S3 Backend Setup

Before running Terraform, create the S3 bucket and DynamoDB table for state management:

```bash
# Create S3 bucket for state
aws s3api create-bucket \
  --bucket campus-events-terraform-state \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket campus-events-terraform-state \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket campus-events-terraform-state \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region us-east-1
```

## AWS Architecture

### VPC Configuration
- **CIDR**: 10.0.0.0/16
- **Availability Zones**: us-east-1a, us-east-1b, us-east-1c
- **Public Subnets**: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
- **Private Subnets**: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
- **Database Subnets**: 10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24
- **NAT Gateways**: Multi-AZ (one per AZ)
- **Flow Logs**: Enabled to CloudWatch

### EKS Cluster Configuration
- **Cluster Name**: campus-events-dev
- **Kubernetes Version**: 1.31
- **Network**: Private endpoint only
- **Addons**:
  - vpc-cni (with prefix delegation)
  - coredns
  - kube-proxy
  - aws-ebs-csi-driver
- **Node Groups**:
  - Name: general
  - Instance Type: m5.xlarge
  - Capacity Type: SPOT
  - Scaling: Min 2, Max 10, Desired 3

### RDS Configuration
- **Engine**: PostgreSQL 16.3
- **Instance Type**: db.t3.medium
- **Database Name**: campus_events
- **Multi-AZ**: Enabled
- **Backup**: 7-day retention
- **Encryption**: KMS encrypted
- **Storage**: 100 GB gp3

## Usage

### 1. Initialize Terraform

```bash
cd terraform/environments/dev
terraform init
```

This will:
- Download provider plugins
- Configure the S3 backend
- Create .terraform directory

### 2. Create terraform.tfvars

Copy the example and customize if needed (most defaults are already set):

```bash
cat > terraform.tfvars <<EOF
aws_region              = "us-east-1"
environment             = "dev"
project_name            = "campus-events"
vpc_cidr                = "10.0.0.0/16"
availability_zones      = ["us-east-1a", "us-east-1b", "us-east-1c"]
public_subnets          = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
private_subnets         = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
database_subnets        = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]
eks_version             = "1.31"
rds_engine_version      = "16.3"
rds_instance_class      = "db.t3.medium"
rds_allocated_storage   = 100
rds_storage_type        = "gp3"
rds_db_name             = "campus_events"
rds_username            = "postgres"
EOF
```

### 3. Plan Deployment

```bash
terraform plan -out=tfplan
```

Review the resources that will be created.

### 4. Apply Configuration

```bash
terraform apply tfplan
```

This will take approximately 20-30 minutes to complete.

### 5. Retrieve Outputs

```bash
terraform output -json
```

Useful outputs:
- `cluster_endpoint`: EKS API endpoint
- `cluster_name`: EKS cluster name
- `vpc_id`: VPC ID
- `rds_endpoint`: RDS connection endpoint

### 6. Configure kubectl

```bash
aws eks update-kubeconfig \
  --region us-east-1 \
  --name campus-events-dev
```

Verify connection:

```bash
kubectl get nodes
```

## Deployment Pipeline

### Development (Manual)
```bash
cd terraform/environments/dev
terraform plan
terraform apply
```

### Production (Recommended)
Use GitOps or CI/CD pipeline:
1. Push Terraform code to feature branch
2. CI pipeline runs `terraform plan`
3. Review and approve in PR
4. Merge to main
5. CD pipeline runs `terraform apply`

## Security Best Practices

✅ **Implemented**:
- RDS encryption with customer-managed KMS keys
- IMDSv2 enforcement on EKS nodes
- Private EKS endpoint (no public access)
- VPC Flow Logs for network monitoring
- Secrets Manager for database credentials
- Multi-AZ RDS deployment
- EBS encryption on node volumes
- IRSA (IAM Roles for Service Accounts) enabled

⚠️ **Additional Recommendations**:
- Enable AWS Config for compliance monitoring
- Use VPC endpoint for S3 to reduce data transfer costs
- Implement EBS snapshots for disaster recovery
- Set up CloudWatch alarms for critical metrics
- Use temporary credentials for Terraform runs

## Troubleshooting

### State Lock Issues
```bash
# View lock
aws dynamodb scan --table-name terraform-state-lock

# Force unlock (use cautiously!)
terraform force-unlock <LOCK_ID>
```

### EKS Cluster Not Ready
```bash
# Check cluster status
aws eks describe-cluster --name campus-events-dev

# View cluster events
kubectl get events --all-namespaces
```

### RDS Connection Issues
```bash
# Test connectivity from EKS node
kubectl run -it --rm debug --image=postgres:latest --restart=Never -- \
  psql -h <RDS_ENDPOINT> -U postgres -d campus_events
```

## Cleanup

⚠️ **Warning**: This will delete all infrastructure!

```bash
terraform destroy
```

## Cost Optimization

- **Spot Instances**: Node group uses SPOT capacity (60-70% savings)
- **Single NAT Gateway**: For dev, consider `single_nat_gateway = true` to save costs
- **RDS Reserved Instances**: For production, reserve capacity for 1-3 years
- **S3 State Lifecycle**: Archive old state versions to Glacier

## Next Steps

1. Deploy application using Kubernetes manifests or Helm charts
2. Configure Ingress for external access
3. Set up monitoring with Prometheus/Grafana
4. Implement backup and disaster recovery
5. Configure CI/CD pipeline for application deployments

## Support

For issues or questions:
1. Check Terraform logs: `TF_LOG=DEBUG terraform apply`
2. Review AWS CloudFormation events in console
3. Check EKS cluster logs in CloudWatch

## License

This Terraform configuration is part of the CampusConnect project.
