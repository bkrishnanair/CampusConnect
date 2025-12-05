output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "public_subnets" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnets
}

output "private_subnets" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnets
}

output "database_subnets" {
  description = "Database subnet IDs"
  value       = module.vpc.database_subnets
}

output "database_subnet_group" {
  description = "Database subnet group name"
  value       = module.vpc.database_subnet_group
}

output "nat_gateway_ips" {
  description = "NAT Gateway IPs"
  value       = module.vpc.nat_public_ips
}
