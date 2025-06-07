# Bill Vending Service

A robust backend service for bill vending that allows users to purchase electricity using a funded wallet system. The service handles transactions asynchronously with event-driven processing, proper failure handling, and concurrency control.

## 🏗️ Architecture Overview

The system follows a microservices-inspired architecture with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Wallet API    │    │ Transaction API │    │   Bill API      │
│                 │    │                 │    │                 │
│ • Fund Wallet   │    │ • Get by ID     │    │ • Pay Bill      │
│ • Check Balance │    │ • Get by User   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Service Layer  │
                    │                 │
                    │ • WalletService │
                    │ • BillService   │
                    │ • TxnService    │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Data Layer     │
                    │                 │
                    │ • Database      │
                    │ • Queue System  │
                    │ • External APIs │
                    └─────────────────┘
```

### Key Components

1. **Wallet System**: Manages user funds with atomic operations
2. **Bill Payment Engine**: Handles electricity bill payments with external API integration
3. **Transaction Management**: Tracks all financial operations with audit trails
4. **Event-Driven Processing**: Asynchronous handling of failures and reversals
5. **Concurrency Control**: Prevents race conditions using database locks and transactions

## 🚀 Features

### Wallet Management
- **Fund Wallet**: Add money to user wallets with validation
- **Balance Inquiry**: Real-time balance checking with transaction history
- **Concurrency Safe**: Atomic operations prevent double-spending

### Bill Payment
- **Electricity Purchase**: Seamless bill payment with external provider integration
- **Failure Handling**: Automatic fund reversal on payment failures
- **Status Tracking**: Real-time payment status updates

### Transaction System
- **Audit Trail**: Complete transaction history with timestamps
- **Idempotency**: Duplicate transaction prevention
- **Event Sourcing**: All state changes captured as events

## 🛠️ Tech Stack

- **Framework**: NestJS (Node.js + TypeScript)
- **Database**: PostgreSQL with TypeORM
- **Queue System**: Bull (Redis-based) for async processing
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest with comprehensive unit/integration tests
- **Logging**: Winston with structured logging
- **Validation**: class-validator for DTO validation

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- Redis (v6 or higher)
- npm or yarn

## 🏃‍♂️ Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/bill-vending-service.git
cd bill-vending-service
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env
```

Configure your `.env` file:
```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=bill_vending

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# External APIs
BILL_PROVIDER_API_URL=https://api.billprovider.com
BILL_PROVIDER_API_KEY=your_api_key

# Application
PORT=3000
NODE_ENV=development
```

### 4. Database Setup
```bash
# Run migrations
npm run migration:run

# Seed initial data (optional)
npm run seed
```

### 5. Start the Application
```bash
# Development
npm run start:dev

# Production
npm run start:prod
```

The API will be available at `http://localhost:3000`

## 📖 API Documentation

### Swagger UI
Access interactive API documentation at: `http://localhost:3000/api`

### Core Endpoints

#### Wallet Operations
```http
POST /wallet/fund
Content-Type: application/json

{
  "userId": "user123",
  "amount": 1000,
  "currency": "NGN"
}
```

```http
GET /wallet/balance/{userId}
```

#### Bill Payment
```http
POST /bills/pay
Content-Type: application/json

{
  "userId": "user123",
  "billType": "electricity",
  "amount": 500,
  "meterNumber": "12345678901",
  "provider": "EKEDC"
}
```

#### Transaction History
```http
GET /transactions/user/{userId}
GET /transactions/{transactionId}
```

### Response Format
All API responses follow a consistent structure:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "timestamp": "2024-06-07T12:00:00.000Z"
}
```

## 🔄 Async Processing & Event Handling

### Event-Driven Architecture
The system uses Redis-based queues for asynchronous processing:

1. **Payment Processing Queue**: Handles bill payment requests
2. **Reversal Queue**: Manages automatic fund reversals on failures
3. **Notification Queue**: Sends user notifications and webhooks

### Failure Handling Flow
```
Payment Request → Deduct Funds → External API Call
                     ↓               ↓
              Success: Complete    Failure: Queue Reversal
                     ↓               ↓
              Update Status    → Reverse Funds → Notify User
```

### Queue Workers
```typescript
// Example: Payment processing worker
@Processor('payment')
export class PaymentProcessor {
  @Process('process-bill-payment')
  async processBillPayment(job: Job<PaymentData>) {
    // Process payment with external API
    // Handle success/failure scenarios
    // Trigger appropriate events
  }
}
```

## 🔒 Concurrency Control

### Database-Level Protection
- **Row-level locking** for wallet balance updates
- **Transactions** ensure atomicity of multi-step operations
- **Unique constraints** prevent duplicate transactions

### Application-Level Guards
```typescript
// Example: Wallet balance update with concurrency control
async updateBalance(userId: string, amount: number) {
  return this.dataSource.transaction(async manager => {
    const wallet = await manager
      .createQueryBuilder(Wallet, 'wallet')
      .setLock('pessimistic_write')
      .where('wallet.userId = :userId', { userId })
      .getOne();
    
    // Atomic balance update
    wallet.balance += amount;
    return manager.save(wallet);
  });
}
```

## 🧪 Testing

### Run Tests
```bash
# Unit tests
npm run test

# Integration tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Test Structure
```
src/
├── wallet/
│   ├── __tests__/
│   │   ├── wallet.controller.spec.ts
│   │   ├── wallet.service.spec.ts
│   │   └── wallet.integration.spec.ts
└── bills/
    ├── __tests__/
    │   ├── bill.controller.spec.ts
    │   └── bill.service.spec.ts
```

## 📊 Monitoring & Logging

### Structured Logging
```typescript
// Example log output
{
  "timestamp": "2024-06-07T12:00:00.000Z",
  "level": "info",
  "message": "Bill payment processed",
  "context": {
    "userId": "user123",
    "transactionId": "txn_456",
    "amount": 500,
    "provider": "EKEDC"
  }
}
```

### Health Checks
```http
GET /health
```

Returns system health status including:
- Database connectivity
- Redis connectivity
- External API status
- Queue processing status

## 🔧 Configuration

### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Application port | `3000` |
| `DATABASE_HOST` | PostgreSQL host | `localhost` |
| `REDIS_HOST` | Redis host | `localhost` |
| `LOG_LEVEL` | Logging level | `info` |
| `QUEUE_CONCURRENCY` | Queue worker concurrency | `5` |

### Feature Flags
```env
# Enable/disable features
ENABLE_NOTIFICATIONS=true
ENABLE_WEBHOOKS=false
STRICT_VALIDATION=true
```

## 🚀 Deployment

### Docker
```bash
# Build image
docker build -t bill-vending-service .

# Run with docker-compose
docker-compose up -d
```

### Production Considerations
- Use connection pooling for database
- Configure Redis clustering for high availability
- Set up proper monitoring and alerting
- Implement rate limiting and security headers
- Use HTTPS in production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the [API documentation](http://localhost:3000/api) for endpoint details
- Review the test files for usage examples

---

**Built with ❤️ using NestJS and TypeScript**