# 🏥 MediBot Backend API

Enterprise-grade healthcare backend built with **NestJS**, **PostgreSQL**, and **TypeORM**.

## 🎯 Features

- ✅ **RESTful API** - Clean, well-documented endpoints
- ✅ **JWT Authentication** - Secure user and staff login
- ✅ **PostgreSQL Database** - Reliable medical data storage
- ✅ **TypeORM** - Type-safe database queries
- ✅ **Swagger Docs** - Auto-generated API documentation
- ✅ **Docker Support** - Easy local development setup
- ✅ **AWS Ready** - Deployable to ECS/ECR
- ✅ **Expo Go Compatible** - Works with mobile app
- ✅ **Sample Data** - Pre-loaded test users and cases

## 📋 Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop/))
- **Git**

## 🚀 Quick Start (5 minutes)

### 1. Clone and Install

```bash
cd medibot-backend
npm install
```

### 2. Start Database (Docker)

```bash
# Start PostgreSQL, Redis, and pgAdmin
npm run docker:up

# Wait 10 seconds for databases to initialize...
```

### 3. Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env and update LOCAL_IP with your computer's IP address
# On macOS: ifconfig | grep "inet " | grep -v 127.0.0.1
# On Windows: ipconfig
# On Linux: hostname -I
```

### 4. Run Database Migrations

```bash
# Create database tables
npm run migration:run

# Load sample data (optional but recommended)
npm run seed:dev
```

### 5. Start Backend Server

```bash
# Development mode (auto-reload)
npm run start:dev
```

**✅ Backend is running!**

- 🌐 Server: http://localhost:3000
- 📚 API Docs: http://localhost:3000/api/docs
- 🗄️ Database GUI: http://localhost:5050 (admin@medibot.local / admin)

## 📱 Connect Expo Go App

### On Your Mobile Device:

1. **Find Your Computer's Local IP:**
   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Windows
   ipconfig
   ```
   Example: `192.168.1.100`

2. **Update .env File:**
   ```bash
   # Replace with your IP
   LOCAL_IP=192.168.1.100
   CORS_ORIGIN=http://localhost:19006,exp://192.168.1.100:19000
   ```

3. **Restart Backend:**
   ```bash
   npm run start:dev
   ```

4. **Update Frontend Config:**
   ```typescript
   // In MediBot/src/config/api.config.ts
   export const API_BASE_URL = 'http://192.168.1.100:3000/api';
   ```

5. **Test Connection:**
   - Open Expo Go app
   - App should now connect to local backend
   - Check backend logs for incoming requests

## 📊 Database Management

### pgAdmin (GUI)

1. Open: http://localhost:5050
2. Login: admin@medibot.local / admin
3. Add Server:
   - Name: MediBot Local
   - Host: postgres (or localhost if not working)
   - Port: 5432
   - Database: medibot_dev
   - Username: medibot
   - Password: medibot_dev_password

### Command Line

```bash
# Access PostgreSQL shell
docker exec -it medibot-postgres psql -U medibot -d medibot_dev

# View tables
\dt

# View users
SELECT * FROM users;

# Exit
\q
```

## 🧪 Sample Data

The backend includes realistic sample data for testing:

### Patient Users (for app login)
```
Email: sarah.johnson@example.com
Password: password123
Condition: Asthma
```

```
Email: robert.chen@example.com
Password: password123
Condition: Type 2 Diabetes
```

```
Email: margaret.williams@example.com
Password: password123
Condition: Hypertension
```

### Staff Users (for admin portal)
```
Email: dr.watson@medibot.com
Password: staff123
Role: Doctor (Cardiology)
```

```
Email: nurse.miller@medibot.com
Password: staff123
Role: Nurse (Emergency)
```

## 🛠️ Development Commands

```bash
# Development
npm run start:dev          # Start with hot-reload
npm run start:debug        # Start with debugger
npm run build              # Build for production
npm run start:prod         # Run production build

# Database
npm run docker:up          # Start Docker containers
npm run docker:down        # Stop Docker containers
npm run migration:run      # Run migrations
npm run migration:revert   # Rollback migration
npm run seed:dev           # Load sample data
npm run seed:reset         # Clear all data

# Testing
npm run test               # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Run tests with coverage
npm run test:e2e           # Run E2E tests
```

## 📁 Project Structure

```
medibot-backend/
├── src/
│   ├── modules/           # Feature modules
│   │   ├── auth/         # Authentication
│   │   ├── users/        # Patient users
│   │   ├── medical-cases/# Case tracking
│   │   ├── bookings/     # Appointments
│   │   └── emergency/    # Emergency services
│   ├── database/
│   │   ├── entities/     # TypeORM entities
│   │   ├── migrations/   # Database migrations
│   │   └── seeds/        # Sample data
│   ├── common/           # Shared code
│   │   ├── decorators/   # Custom decorators
│   │   ├── guards/       # Auth guards
│   │   └── interceptors/ # HTTP interceptors
│   ├── config/           # Configuration
│   ├── main.ts           # App entry point
│   └── app.module.ts     # Root module
├── test/                 # Tests
├── docker-compose.yml    # Docker setup
├── Dockerfile           # Production build
└── .env.example         # Environment template
```

## 🔌 API Endpoints

### Authentication
```http
POST   /api/auth/register          # Patient registration
POST   /api/auth/login             # Patient login
POST   /api/auth/guest             # Guest user
POST   /api/auth/staff/login       # Staff login
POST   /api/auth/refresh           # Refresh token
GET    /api/auth/me                # Current user
```

### Users
```http
GET    /api/users/:id              # Get profile
PATCH  /api/users/:id              # Update profile
GET    /api/users/:id/medical-history
POST   /api/users/:id/medications
```

### Medical Cases
```http
GET    /api/cases                  # List cases
POST   /api/cases                  # Create case
GET    /api/cases/:id              # Get case details
POST   /api/cases/:id/notes        # Add note
POST   /api/cases/:id/triage       # Perform triage
```

Full API documentation: http://localhost:3000/api/docs

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart Docker containers
npm run docker:down
npm run docker:up
```

### Port Already in Use
```bash
# Check what's using port 3000
lsof -ti:3000

# Kill the process (macOS/Linux)
kill -9 $(lsof -ti:3000)
```

### Cannot Connect from Expo Go
1. Verify LOCAL_IP in .env matches your computer's IP
2. Ensure computer and phone are on same WiFi
3. Check firewall isn't blocking port 3000
4. Restart backend server after .env changes

### Reset Everything
```bash
# Stop containers and delete all data
npm run docker:down -v

# Start fresh
npm run docker:up
npm run migration:run
npm run seed:dev
npm run start:dev
```

## 📚 Next Steps

1. **Phase 2**: Implement REST API endpoints
2. **Phase 3**: Connect frontend to backend
3. **Phase 4**: Setup CI/CD pipeline
4. **Phase 5**: Deploy to AWS

## 🆘 Need Help?

- 📖 [NestJS Documentation](https://docs.nestjs.com/)
- 📖 [TypeORM Documentation](https://typeorm.io/)
- 📖 [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Made with ❤️ for healthcare innovation**
