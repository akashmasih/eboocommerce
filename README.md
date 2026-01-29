# E-boo Ecommerce Platform (Microservices)

E-boo is a production-grade, enterprise-scale e-commerce platform designed with a **Node.js + Express.js + TypeScript** microservices architecture.

**Author**: Akash Masih

## High-Level Architecture
- **API Gateway / BFF (GraphQL)**: Single entry point for frontend, aggregates data from internal services, validates JWT, enforces rate limits, propagates tracing.
- **Microservices**: Independently deployable/scalable, each owns its database.
- **REST**: Public and internal service-to-service APIs.
- **GraphQL**: Internal aggregation layer for frontend (BFF).
- **Datastores**:
  - **PostgreSQL** (single database) for all services (auth, product, pricing, inventory, cart, order, payment, seller, shipping, notifications, reviews).
  - **Redis** for caching, sessions, rate limiting.
- **Event-driven integration**: RabbitMQ topics for order/payment/notification events.
- **API Documentation**: Auto-generated Swagger/OpenAPI docs for each service.

## Services
- **API Gateway / BFF** (Port 4000) - GraphQL aggregation
- **Auth & User** (Port 4001) - Authentication & authorization
- **Product Catalog** (Port 4002) - Product CRUD, categories, search
- **Pricing & Offers** (Port 4003) - Pricing, discounts, coupons
- **Inventory** (Port 4004) - Stock tracking, reservations
- **Cart** (Port 4005) - Shopping cart management
- **Order** (Port 4006) - Order lifecycle
- **Payment** (Port 4007) - Payment processing
- **Seller** (Port 4008) - Seller management
- **Shipping** (Port 4009) - Shipping & tracking
- **Notification** (Port 4010) - Email/SMS notifications
- **Review & Rating** (Port 4011) - Product reviews
- **Documentation Service** (Port 4012) - API docs aggregator

## API Documentation

### Documentation Hub
Visit `http://localhost:4012/docs` to access the central documentation hub that aggregates all service documentation.

### Per-Service Documentation
Each service exposes Swagger UI at:
- `http://localhost:{port}/api/docs`
- OpenAPI JSON at: `http://localhost:{port}/api/docs/swagger.json`

### Adding Documentation
See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed guide on adding Swagger annotations to routes.

## Development Setup (Recommended)

**For development, we recommend running services locally (not in Docker) for faster iteration.**

### Quick Start

1. **Start Infrastructure (Databases)**
   ```bash
   # Start only databases and infrastructure services
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Install Dependencies**
   ```bash
   # Install root dependencies (concurrently)
   npm install
   
   # Install all service dependencies
   npm run install:all
   ```

3. **Set Up Environment Variables**
   ```bash
   # Each service needs a .env file
   # Copy examples if available, or create with:
   # PORT=4001
   # SERVICE_NAME=auth-service
   # DATABASE_URL=postgresql://eboo:eboo123@localhost:5432/eboocommerce
   # REDIS_URL=redis://localhost:6379
   # RABBITMQ_URL=amqp://eboo:eboo123@localhost:5672
   ```

4. **Run Database Migrations** (for Prisma services)
   ```bash
   cd services/auth-service
   npx prisma migrate dev
   # Repeat for other Prisma services
   ```

5. **Start All Services**
   ```bash
   # Run all services in development mode with hot reload
   npm run dev
   ```

### Access Points
- **GraphQL Gateway**: http://localhost:4000/graphql
- **Documentation Hub**: http://localhost:4012/docs
- **RabbitMQ Management**: http://localhost:15672 (user: eboo, pass: eboo123)

### Verifying Services Are Running

**Option 1: Use the verification script (Recommended)**
```powershell
.\verify-services.ps1
```

**Option 2: Manual checks**
```powershell
# Check if ports are listening
Get-NetTCPConnection -LocalPort 4000,4001,4002,4003,4004,4005,4006,4007,4008,4009,4010,4011,4012 -ErrorAction SilentlyContinue

# Test health endpoints
Invoke-WebRequest -Uri http://localhost:4001/api/health
Invoke-WebRequest -Uri http://localhost:4002/api/health
# ... etc for each service
```

**Option 3: Browser/curl checks**
- Open http://localhost:4012/docs in browser (Docs Service)
- Open http://localhost:4000/graphql in browser (API Gateway)
- Check terminal output for service startup messages

**Option 4: Check process list**
```powershell
# See all Node.js processes
Get-Process node -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, StartTime
```

### Running Individual Services
```bash
# Run a single service
cd services/auth-service
npm install
npm run dev
```

See [dev-setup.md](./dev-setup.md) for detailed development instructions.

## Production/Deployment Setup

For production deployment with Docker:
```bash
docker-compose -f docker-compose.prod.yml up --build
```

**Note**: Production Docker setup is simplified. For full containerization, see deployment documentation.

## Git Setup

The repository is configured with git user name: **Akash Masih**

To complete git setup:
```bash
# Windows
.\setup-git.ps1

# Linux/Mac
./setup-git.sh
```

Or manually:
```bash
git config user.name "Akash Masih"
git config user.email "dev.akashmasih@gmail.com"
```

See [GIT_SETUP.md](./GIT_SETUP.md) for detailed instructions.

## Key Flows
See each service folder for REST endpoints and contracts. All endpoints are documented in Swagger UI.

## Configuration
See [CONFIGURATION.md](./CONFIGURATION.md) for detailed configuration guide.

## Architecture
See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.
