# Bill Vending Service

A robust backend service for bill vending that allows users to purchase electricity using a funded wallet system. The service handles transactions asynchronously with event-driven processing, proper failure handling, and concurrency control.

## 🏗️ Architecture Overview

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
                    │ • TransactionService │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Data Layer     │
                    │                 │
                    │ • MongoDB Atlas │
                    │ • Redis Queue   │
                    │ • External APIs │
                    └─────────────────┘
```

### Key Components

1. **Wallet System**: Fund management with atomic operations
2. **Bill Payment Engine**: Electricity bill payments with external API integration
3. **Transaction Management**: Complete audit trail of all operations
4. **Event-Driven Processing**: Asynchronous failure handling and reversals
5. **Concurrency Control**: Race condition prevention using MongoDB transactions

## 🛠️ Tech Stack

- **Framework**: NestJS (Node.js + TypeScript)
- **Database**: MongoDB with Mongoose
- **Queue System**: Bull (Redis-based) for async processing
- **Documentation**: Swagger/OpenAPI at `/api/docs`
- **Testing**: Jest with comprehensive coverage
- **Logging**: Winston with structured logging
- **Validation**: class-validator and class-transformer

## 📦 Dependencies

### Core Dependencies
- **@nestjs/common** ^10.0.0 - Core NestJS framework
- **@nestjs/core** ^10.0.0 - NestJS core functionality
- **@nestjs/platform-express** ^10.0.0 - Express platform adapter
- **@nestjs/mongoose** ^10.0.2 - MongoDB integration
- **@nestjs/swagger** ^7.1.17 - API documentation
- **@nestjs/config** ^3.1.1 - Configuration management
- **@nestjs/bull** ^10.0.1 - Queue management
- **bull** ^4.12.2 - Redis-based queue system
- **mongoose** ^8.0.3 - MongoDB object modeling
- **class-validator** ^0.14.0 - Validation decorators
- **class-transformer** ^0.5.1 - Object transformation
- **uuid** ^9.0.1 - UUID generation
- **winston** ^3.11.0 - Logging library
- **nest-winston** ^1.9.4 - Winston integration for NestJS
- **redis** ^4.6.10 - Redis client

### Development Dependencies
- **@nestjs/cli** ^10.0.0 - NestJS command line interface
- **@nestjs/testing** ^10.0.0 - Testing utilities
- **jest** ^29.5.0 - Testing framework
- **typescript** ^5.1.3 - TypeScript compiler
- **eslint** ^8.42.0 - Code linting
- **prettier** ^3.0.0 - Code formatting
- **supertest** ^6.3.3 - HTTP assertion testing

## 📋 Prerequisites

- Node.js (v18 or higher)
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

# Application
NODE_ENV=development
PORT=3000
```

### 3. Start the Application
```bash
npm run start:dev
```

## 🛠️ Available Scripts

```bash
# Build the application
npm run build

# Format code with Prettier
npm run format

# Start application
npm run start                # Production mode
npm run start:dev           # Development mode with watch
npm run start:debug         # Debug mode with watch
npm run start:prod          # Production build

# Code quality
npm run lint                # ESLint with auto-fix
npm run format             # Prettier formatting

# Testing
npm run test               # Unit tests
npm run test:watch         # Watch mode
npm run test:cov           # Coverage report
npm run test:debug         # Debug tests
npm run test:e2e           # Integration tests
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

## 🧪 Testing Configuration

The project uses Jest with the following configuration:
- **Test files**: `*.spec.ts` pattern
- **Coverage**: Comprehensive coverage reporting
- **Environment**: Node.js test environment
- **Transform**: TypeScript support via ts-jest

Run tests with coverage:
```bash
npm run test:cov
```

## 🚀 Production Deployment

```bash
docker-compose up -d
```

**Production considerations**: MongoDB Atlas network controls, Redis clustering, rate limiting, HTTPS, real API integrations.

## 📝 Project Information

- **Name**: bill-vending-service
- **Version**: 0.0.1
- **License**: UNLICENSED
- **Description**: Backend service for bill vending with wallet system

---

**Built with ❤️ using NestJS, TypeScript, and MongoDB**