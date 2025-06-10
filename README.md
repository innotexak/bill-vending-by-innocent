# Bill Vending Service

A robust backend service for bill vending that allows users to purchase electricity using a funded wallet system. The service handles transactions asynchronously with event-driven processing, proper failure handling, and concurrency control.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User API      │    │   Wallet API    │    │ Transaction API │    │   Bill API      │
│                 │    │                 │    │                 │    │                 │
│ • Register      │    │ • Fund Wallet   │    │ • Get by ID     │    │ • Pay Bill      │
│ • Login         │    │ • Check Balance │    │ • Get by User   │    │ • Queue status  │
│ • Logout        │    └─────────────────┘    └─────────────────┘    └─────────────────┘
│ • Profile       │
└─────────────────┘
         │                         │                       │                       │
         └─────────────────────────┼───────────────────────┼───────────────────────┘
                                   │                       │
                    ┌───────────────────────────────┐      │
                    │         Service Layer         │      │
                    │                               │      │
                    │ • UserService                 │◀─────┘
                    │ • WalletService               │
                    │ • BillService                 │
                    │ • TransactionService          │
                    └───────────────────────────────┘
                                   │
                    ┌───────────────────────────────┐
                    │           Data Layer          │
                    │                               │
                    │ • MongoDB Atlas (Users, etc.) │
                    │ • Redis Queue (Bull)          │
                    │ • External APIs               │
                    └───────────────────────────────┘
```

### Folder Structure 
```
src/
├── bill/
│   ├── bill.service.ts              <-- Main file you shared
│   ├── dto/
│   │   └── pay-bill.dto.ts
│   ├── interfaces/
│   │   ├── reversal-data.interface.ts
│   │   └── bill-payment-process-data.interface.ts
│   ├── dto/
│   │   └── bill-payment-request.dto.ts
│   └── services/
│       └── external-bill-payment.service.ts
│
├── wallet/
│   └── wallet.service.ts
│
├── transaction/
│   └── transaction.service.ts
│
├── common/
│   ├── enums/
│   │   ├── transaction-type.enum.ts
│   │   └── transaction-status.enum.ts
│   └── decorators/
│       └── get-current-user.decorator.ts
├── user/
│   ├── user.service.ts         
│   ├── user.controller.ts     
│   ├── dto/
│   │   ├── register.dto.ts    
│   │   └── login.dto.ts        
│   └── schemas/
│       └── user.schema.ts     
└── main.ts

```
### Key Components

1. **Wallet System**: Fund management with atomic operations
2. **Bill Payment Engine**: Electricity bill payments with external API integration
3. **Transaction Management**: Complete audit trail of all operations
4. **Event-Driven Processing**: Asynchronous failure handling and reversals
5. **Concurrency Control**: Race condition prevention using MongoDB transactions
6. **User Management**: User management system (authentication)

## 🛠️ Tech Stack

- **Framework**: NestJS (Node.js + TypeScript)
- **Database**: MongoDB with Mongoose
- **Queue System**: Bull (Redis-based) for async processing
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest with comprehensive coverage
- **Logging**: Winston with structured logging
- **Validation**: class-validator and class-transformer

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (Atlas or local instance)
- Redis (v6 or higher)
- npm or yarn

## 🏃‍♂️ Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/innotexak/bill-vending-by-innocent.git bill-vending-service
cd bill-vending-service
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
```

Configure your `.env` file:
```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster0.6lymd.mongodb.net/billing?retryWrites=true&w=majority

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD="redis password"

# Application
NODE_ENV=development
PORT=3000
JWT_SECRET='jdbkajdbvdkahvndajhbvknasdkvbh'
FRONTEND_URL=http://localhost:3000
```

### 3. Start the Application
```bash
npm run start:dev
```

## 🛠️ Available Scripts

```bash
# Development
npm run start:dev           # Development mode with watch
npm run start:debug         # Debug mode with watch

# Production
npm run build              # Build the application
npm run start:prod         # Production build

# Code Quality
npm run lint               # ESLint with auto-fix
npm run format            # Prettier formatting

# Testing
npm run test              # Unit tests
npm run test:watch        # Watch mode
npm run test:cov          # Coverage report
npm run test:e2e          # Integration tests
```

## 📖 API Documentation

**Swagger UI**: `http://localhost:3000/api/docs`

### Core Features
- **Wallet Operations**: Fund wallet, check balance
- **Bill Payment**: Pay electricity bills with automatic reversals on failure
- **Transaction History**: Complete audit trail with status tracking

## 🔄 External Service Integration

Mocked external bill payment service simulates real-world scenarios:
- **80% success rate** with 2-second delay
- **Failure scenarios**: INVALID_ACCOUNT, SERVICE_UNAVAILABLE, TIMEOUT, INSUFFICIENT_CREDIT
- **Automatic reversals** on payment failures via Redis queues

## 🔒 Concurrency Control

- **MongoDB transactions** for multi-document operations
- **Optimistic concurrency control** using document versioning
- **Atomic operations** prevent race conditions and double-spending

## 🧪 Testing

Run tests with coverage:
```bash
npm run test:cov
```

The project uses Jest with comprehensive test coverage for all core functionality.

## 🚀 Production Deployment

```bash
docker-compose up -d
```

**Production considerations**: MongoDB Atlas network controls, Redis clustering, rate limiting, HTTPS, real API integrations.

---

**Built with ❤️ using NestJS, TypeScript, and MongoDB**