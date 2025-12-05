# CampusConnect Terraform Deployment Guide

## Overview

This guide walks through deploying the complete CampusConnect infrastructure on AWS using Terraform.

**Timeline**: ~25-30 minutes for full deployment

## Prerequisites Checklist

- [ ] AWS Account with admin/deployment privileges
- [ ] AWS CLI v2 installed and configured
- [ ] Terraform >= 1.9 installed
- [ ] kubectl installed
- [ ] Git configured with credentials
- [ ] Sufficient AWS service quotas:
  - EKS clusters: 1
  - EKS node groups: 1
  - EC2 instances (m5.xlarge): 10 (for max node group size)
  - RDS instances: 1
  - VPCs: 1
  - NAT Gateways: 3

## Step-by-Step Deployment

### Step 1: Prepare AWS S3 Backend (One-time Setup)

Create the S3 bucket and DynamoDB table for Terraform state management:

```bash
# Create S3 bucket
aws s3api create-bucket \
  --bucket campus-events-terraform-state \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket campus-events-terraform-state \
  --versioning-configuration Status=Enabled

# Block public access
aws s3api put-public-access-block \
  --bucket campus-events-terraform-state \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Create DynamoDB lock table
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region us-east-1

# Verify
echo "✅ S3 bucket created"
aws s3 ls s3://campus-events-terraform-state
echo "✅ DynamoDB table created"
aws dynamodb describe-table --table-name terraform-state-lock --region us-east-1 | grep TableStatus
```

### Step 2: Clone and Navigate to Terraform Directory

```bash
cd /Users/bkrishna/dev/CampusConnect/terraform/environments/dev
```

### Step 3: Initialize Terraform

```bash
terraform init
```

**Expected Output**:
```
Initializing the backend...
Successfully configured the backend "s3"!
Initializing provider plugins...
Installed terraform-aws-modules/vpc/aws v5.x.x
Installed terraform-aws-modules/eks/aws v20.x.x
...
Terraform has been successfully initialized!
```

### Step 4: Create terraform.tfvars

The defaults are already suitable for dev environment. Create the file:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Review and customize if needed:

```bash
cat terraform.tfvars
```

### Step 5: Validate Configuration

```bash
terraform validate
```

**Expected Output**:
```
Success! The configuration is valid.
```

### Step 6: Generate and Review Plan

```bash
terraform plan -out=tfplan
```

This will:
- Create VPC with subnets, NAT gateways, flow logs
- Create EKS cluster with managed node group
- Create RDS PostgreSQL instance
- Create security groups, IAM roles, KMS keys

**Review the plan** for approximately:
- 50+ resources to be created
- Resources in correct AZs
- Security group rules appropriate

### Step 7: Apply Configuration

```bash
terraform apply tfplan
```

**Monitor the deployment**:

**Phase 1 (2-3 min)**: VPC and networking
```
module.vpc.module.vpc.aws_vpc.this[0]: Creating...
module.vpc.module.vpc.aws_subnet.public[0]: Creating...
```

**Phase 2 (15-20 min)**: EKS cluster
```
module.eks.module.eks.aws_eks_cluster.this[0]: Creating...
module.eks.module.eks_managed_node_group.this["general"]: Creating...
```

**Phase 3 (5-10 min)**: RDS instance
```
module.rds.aws_db_instance.postgres: Creating...
```

Total time: **20-30 minutes**

### Step 8: Verify Deployment

Once deployment completes, verify all components:

```bash
# Save outputs
terraform output -json > deployment-outputs.json

# Get cluster name
CLUSTER_NAME=$(terraform output -raw cluster_name)
echo "Cluster: $CLUSTER_NAME"

# Get RDS endpoint
RDS_ENDPOINT=$(terraform output rds_endpoint)
echo "RDS: $RDS_ENDPOINT"
```

#### Verify VPC

```bash
VPC_ID=$(terraform output -raw vpc_id)
aws ec2 describe-vpcs --vpc-ids $VPC_ID --region us-east-1 | grep -A 1 CidrBlock
```

#### Verify EKS Cluster

```bash
aws eks describe-cluster --name $CLUSTER_NAME --region us-east-1 | grep Status
```

Expected: `"Status": "ACTIVE"`

#### Verify Node Group

```bash
aws eks describe-nodegroup \
  --cluster-name $CLUSTER_NAME \
  --nodegroup-name ${CLUSTER_NAME}-general \
  --region us-east-1 | grep -E "status|instanceTypes"
```

#### Verify RDS Instance

```bash
aws rds describe-db-instances --db-instance-identifier ${CLUSTER_NAME}-postgres --region us-east-1 | grep -E "DBInstanceStatus|DBInstanceClass"
```

Expected: `"DBInstanceStatus": "available"`

### Step 9: Configure kubectl

```bash
# Update kubeconfig
aws eks update-kubeconfig --region us-east-1 --name $CLUSTER_NAME

# Verify connectivity
kubectl cluster-info
kubectl get nodes
kubectl get pods -A
```

Expected output shows nodes and system pods running:
```
NAME                          STATUS   ROLES    AGE
ip-10-0-11-xxx.ec2.internal   Ready    <none>   5m
ip-10-0-12-xxx.ec2.internal   Ready    <none>   5m
ip-10-0-13-xxx.ec2.internal   Ready    <none>   4m
```

### Step 10: Verify Database Connectivity

Retrieve database credentials from Secrets Manager:

```bash
SECRET_ARN=$(terraform output -raw secrets_manager_secret_arn)
SECRET_JSON=$(aws secretsmanager get-secret-value --secret-id $SECRET_ARN --query SecretString --output text)
DB_HOST=$(echo $SECRET_JSON | jq -r '.host' | cut -d: -f1)
DB_USER=$(echo $SECRET_JSON | jq -r '.username')

# Test from EKS pod
kubectl run -it --rm postgres-test \
  --image=postgres:16 \
  --restart=Never \
  -- psql -h $DB_HOST -U $DB_USER -d campus_events -c "SELECT version();"
```

## Post-Deployment Steps

### 1. Store Terraform State Backup

```bash
aws s3 cp terraform.tfstate s3://campus-events-terraform-state/dev/terraform.tfstate.backup
```

### 2. Document Outputs

```bash
terraform output > DEPLOYMENT_OUTPUTS.txt
git add DEPLOYMENT_OUTPUTS.txt
git commit -m "feat: infrastructure deployed to dev environment"
```

### 3. Set Up Monitoring

```bash
# Enable EKS control plane logging
aws eks update-cluster-logging --name $CLUSTER_NAME \
  --logging-config clusterLogging='[{enabled: true, types: ["api","audit","authenticator","controllerManager","scheduler"]}]' \
  --region us-east-1
```

### 4. Configure CI/CD Access

Create IAM user for CI/CD pipeline:

```bash
aws iam create-user --user-name campus-events-ci-cd
aws iam attach-user-policy --user-name campus-events-ci-cd \
  --policy-arn arn:aws:iam::aws:policy/AmazonEKSClusterPolicy
```

### 5. Deploy Applications

Once cluster is ready, deploy the microservices:

```bash
# Apply Kubernetes manifests for Events API, Notification Service, Frontend
kubectl apply -f k8s/namespaces.yaml
kubectl apply -f k8s/configmaps.yaml
kubectl apply -f k8s/deployments.yaml
kubectl apply -f k8s/services.yaml
```

## Troubleshooting

### EKS Cluster Creation Times Out

```bash
# Check cluster events
aws eks describe-cluster --name $CLUSTER_NAME --region us-east-1 | grep -E "status|createdAt"

# Check node group status
aws eks describe-nodegroup --cluster-name $CLUSTER_NAME --nodegroup-name ${CLUSTER_NAME}-general --region us-east-1 | grep -E "status|statusReason"
```

### RDS Instance Not Available

```bash
# Check RDS status
aws rds describe-db-instances --db-instance-identifier ${CLUSTER_NAME}-postgres --region us-east-1 | grep -E "DBInstanceStatus|PendingModifiedValues"

# View creation events
aws rds describe-events --source-identifier ${CLUSTER_NAME}-postgres --source-type db-instance --region us-east-1 | head -20
```

### Terraform State Lock Issues

```bash
# View locks
aws dynamodb scan --table-name terraform-state-lock --region us-east-1

# Force unlock (use cautiously)
terraform force-unlock <LOCK_ID>
```

## Cost Estimation

**Monthly Estimate** (dev environment):

| Service | Instance Type | Count | Est. Cost |
|---------|---------------|-------|-----------|
| EKS Cluster | - | 1 | $73 |
| EC2 Nodes (Spot) | m5.xlarge | 3 | ~$50/month |
| RDS | db.t3.medium | 1 | ~$100/month |
| NAT Gateways | Multi-AZ | 3 | ~$96 |
| Data Transfer | - | - | ~$10 |
| **Total** | | | **~$330/month** |

*Note: Spot instances can reduce compute costs by 60-70%*

## Cleanup (If Needed)

⚠️ **CAUTION**: This will delete all infrastructure

```bash
# Backup state first
terraform state pull > terraform.tfstate.backup

# Destroy all resources
terraform destroy

# Confirm deletion
aws eks describe-clusters --region us-east-1
aws rds describe-db-instances --region us-east-1
```

## Next Steps

1. **Deploy Applications**: Push microservices to EKS
2. **Configure Ingress**: Set up ALB/NLB for external access
3. **Monitoring & Logging**: Implement Prometheus, ELK, or CloudWatch
4. **CI/CD Pipeline**: Integrate Terraform with GitLab/GitHub Actions
5. **Backup Strategy**: Configure RDS automated backups and EBS snapshots
6. **Disaster Recovery**: Test failover scenarios
7. **Cost Optimization**: Review Reserved Instances for production

## Support & Documentation

- AWS EKS Documentation: https://docs.aws.amazon.com/eks/
- Terraform AWS Provider: https://registry.terraform.io/providers/hashicorp/aws/latest/docs
- CampusConnect Project Docs: See `/docs` folder
