#!/bin/bash
# deploy.sh - Production deployment script for CentOS
# Run this script on your CentOS server to deploy the application

set -e

DEPLOY_PATH="${DEPLOY_PATH:-/opt/eboocommerce}"
cd "$DEPLOY_PATH"

echo "=========================================="
echo "E-boo Commerce - Production Deployment"
echo "=========================================="
echo ""

echo "Step 1: Pulling latest code..."
git pull origin main || git pull origin master

echo ""
echo "Step 2: Starting infrastructure services (databases with volumes - data persists)..."
echo ""

# Start PostgreSQL database (single database for all services)
echo "Starting PostgreSQL database..."
docker-compose up -d postgres

# Start Redis and RabbitMQ
echo "Starting Redis and RabbitMQ..."
docker-compose up -d redis rabbitmq

echo ""
echo "Step 3: Waiting for databases to be ready..."
sleep 15

echo ""
echo "Step 4: Building and starting all services..."
docker-compose build
docker-compose up -d

echo ""
echo "Step 5: Running database migrations (all services use PostgreSQL)..."
echo ""

# Run migrations for all Prisma services
docker-compose exec -T auth-service npx prisma migrate deploy || echo "Auth service migration skipped"
docker-compose exec -T product-service npx prisma migrate deploy || echo "Product service migration skipped"
docker-compose exec -T pricing-service npx prisma migrate deploy || echo "Pricing service migration skipped"
docker-compose exec -T inventory-service npx prisma migrate deploy || echo "Inventory service migration skipped"
docker-compose exec -T cart-service npx prisma migrate deploy || echo "Cart service migration skipped"
docker-compose exec -T order-service npx prisma migrate deploy || echo "Order service migration skipped"
docker-compose exec -T payment-service npx prisma migrate deploy || echo "Payment service migration skipped"
docker-compose exec -T seller-service npx prisma migrate deploy || echo "Seller service migration skipped"
docker-compose exec -T shipping-service npx prisma migrate deploy || echo "Shipping service migration skipped"
docker-compose exec -T notification-service npx prisma migrate deploy || echo "Notification service migration skipped"
docker-compose exec -T review-service npx prisma migrate deploy || echo "Review service migration skipped"

echo ""
echo "Step 6: Cleaning up old Docker images..."
docker image prune -f

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Service Status:"
docker-compose ps

echo ""
echo "To view logs: docker-compose logs -f [service-name]"
echo "To stop services: docker-compose down"
echo "To restart a service: docker-compose restart [service-name]"
