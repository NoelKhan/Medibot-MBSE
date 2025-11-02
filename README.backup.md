# 🏥 MediBot MBSE - Healthcare Management Platform# MediBot - AI-Powered Emergency Triage Platform



[![CI/CD](https://github.com/NoelKhan/medibot-backend/actions/workflows/backend-cicd.yml/badge.svg)](https://github.com/NoelKhan/medibot-backend/actions)**Monorepo** containing all MediBot services and infrastructure.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[![Node.js](https://img.shields.io/badge/Node.js-18.x%20|%2020.x-green.svg)](https://nodejs.org/)## 🚀 Quick Start

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/)

```bash

A modern, full-stack healthcare management platform built with Model-Based Systems Engineering principles, featuring AI-powered medical assistance, patient management, appointment scheduling, and telemedicine capabilities.# Start all services

./scripts/development/start-all.sh

## 🚀 Quick Start

# Check service health

### One-Command Setup./scripts/development/check-services.sh



```bash# Run tests

git clone https://github.com/NoelKhan/medibot-backend.git Medibot-MBSE./scripts/testing/test-all.sh

cd Medibot-MBSE```

chmod +x scripts/development/start-all.sh

./scripts/development/start-all.sh## 📦 Projects

```

| Service | Path | Description |

This will start:|---------|------|-------------|

- ✅ Backend API (NestJS) on port 3001| **Mobile App** | [MediBot/](./MediBot/) | React Native iOS/Android app |

- ✅ AI Agent (Python + Ollama) on port 8000| **Web Dashboard** | [medibot-web/](./medibot-web/) | React web application |

- ✅ Web App (React + Vite) on port 3000| **Backend API** | [medibot-backend/](./medibot-backend/) | NestJS REST API |

- ✅ Mobile App (React Native + Expo)| **AI Agent** | [AIAgent/](./AIAgent/) | FastAPI AI service |



### Manual Setup## 📚 Documentation

See **[SETUP_AND_DEPLOYMENT.md](./docs/SETUP_AND_DEPLOYMENT.md)** for detailed instructions.

Complete documentation is available in the [docs/](./docs/) directory:



## 📁 Project Structure

```
Medibot-MBSE/
├── medibot-backend/      # NestJS Backend API + AI Agent
├── medibot-web/          # React Web Application
├── medibot-mobile/       # React Native Mobile App
├── infrastructure/       # Docker & Kubernetes configs
├── scripts/             # Automation scripts
└── tests/               # Integration tests
```

## 🎯 Features

### 🏥 Patient Management
- Electronic Health Records (EHR)
- Patient registration and profiles
- Medical history tracking
- Document management

### 📅 Appointment System
- Online booking and scheduling
- Calendar integration
- Automated reminders
- Waitlist management

### 🤖 AI-Powered Assistant
- Medical Q&A chatbot
- Symptom analysis
- Treatment recommendations
- Drug interaction checks

### 💬 Telemedicine
- Video consultations
- Secure messaging
- Real-time notifications
- Prescription management

### 📊 Analytics & Reporting
- Patient insights dashboard
- Treatment outcomes tracking
- Operational metrics
- Financial reporting

## 🛠️ Technology Stack

### Backend
- **Framework:** NestJS (Node.js)
- **Database:** PostgreSQL 14+
- **Cache:** Redis### Setup

- **ORM:** TypeORM

- **API Docs:** Swagger/OpenAPI```bash

- **Authentication:** JWT# Install all dependencies

./scripts/development/install-dependencies.sh

### AI Agent

- **Framework:** FastAPI (Python)# Start services

- **LLM:** Ollama (Llama 2)./scripts/development/start-all.sh

- **ML:** TensorFlow, scikit-learn

- **NLP:** spaCy# Verify everything is running

./scripts/development/check-services.sh

### Web Frontend```

- **Framework:** React 18

- **Build Tool:** Vite### Available Scripts

- **UI Library:** Material-UI (MUI)

- **State Management:** React Query**Development:**

- **Routing:** React Router v7- `scripts/development/start-all.sh` - Start all services

- **Charts:** Chart.js- `scripts/development/stop-all.sh` - Stop all services

- `scripts/development/check-services.sh` - Health check

### Mobile App- `scripts/development/install-dependencies.sh` - Install deps

- **Framework:** React Native

- **Platform:** Expo**Testing:**

- **Navigation:** React Navigation- `scripts/testing/test-all.sh` - Run all tests

- **State:** AsyncStorage- `scripts/testing/test-integration.sh` - Integration tests

- **API:** Axios- `scripts/testing/test-ai-agent.sh` - AI agent tests



### DevOps**Deployment:**

- **Containerization:** Docker & Docker Compose- `scripts/deployment/deploy-production.sh` - Deploy to production

- **Orchestration:** Kubernetes- `scripts/deployment/deploy-k8s.sh` - Deploy to Kubernetes

- **CI/CD:** GitHub Actions- `scripts/deployment/setup-github-secrets.sh` - Setup secrets

- **Cloud:** AWS EKS / Google GKE / Azure AKS

**Utilities:**

## 📚 Documentation- `scripts/utilities/status-check.sh` - System status

- `scripts/utilities/show-summary.sh` - Show summary

| Document | Description |
|----------|-------------|
| **[SETUP_AND_DEPLOYMENT.md](./docs/SETUP_AND_DEPLOYMENT.md)** | Complete setup and deployment guide |
| [medibot-backend/README.md](./medibot-backend/README.md) | Backend API documentation |

| [medibot-web/README.md](./medibot-web/README.md) | Web app documentation |### Quick Deploy

| [medibot-mobile/README.md](./medibot-mobile/README.md) | Mobile app documentation |

Deploy all services to production in one command:

## 🔧 Development```bash

./scripts/deployment/deploy-production.sh

### Prerequisites```



- Node.js 18.x or 20.x### Platform Options

- Python 3.9+

- PostgreSQL 14+| Platform | Best For | Cost | Deploy Time |

- Redis 7+|----------|----------|------|-------------|

- Docker & Docker Compose| **Railway** | Backend + Database | $5-15/mo | 15 min |

| **Vercel** | Web Dashboard | Free | 5 min |

### Environment Setup| **Expo EAS** | Mobile App | Free builds | 30 min |



```bash### Deploy Individual Services

# Install dependencies for all services

./scripts/development/install-dependencies.sh**Backend API (Railway)**

```bash

# Start all services in development modecd medibot-backend

./scripts/development/start-all.shrailway login

railway init

# Stop all servicesrailway up

./scripts/development/stop-all.sh```

```

**Web Dashboard (Vercel)**

### Run Individual Services```bash

cd medibot-web

#### Backend APIvercel login

```bashvercel --prod

cd medibot-backend```

npm install

npm run start:dev**Mobile App (Expo)**

# Available at http://localhost:3001```bash

```cd MediBot

eas login

#### AI Agenteas build --platform all --profile production

```bash```

cd medibot-backend/python/aiagent

python3 -m venv venv**Complete Guide**: See [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md) for detailed instructions.

source venv/bin/activate

pip install -r requirements.txt---

cd api && python main.py

# Available at http://localhost:8000## 👥 For End Users

```

### Using MediBot

#### Web App

```bashMediBot is an AI-powered medical triage platform available on:

cd medibot-web- 📱 **Mobile**: iOS and Android apps

npm install- 🌐 **Web**: Browser-based dashboard

npm run dev- 🤖 **AI Assistant**: 24/7 symptom checker

# Available at http://localhost:3000

```### Key Features

- ✅ Emergency symptom assessment

#### Mobile App- ✅ Medication information & tracking

```bash- ✅ Health records management

cd medibot-mobile- ✅ AI-powered triage recommendations

npm install- ✅ 🔴🟠🟡🟢 Color-coded urgency levels

npm start

# Scan QR code with Expo Go### Get Started (5 Minutes)

```1. Download the app or visit the website

2. Create your account

## 🐳 Docker Deployment3. Complete your health profile

4. Start checking symptoms

### Using Docker Compose

**Full User Guide**: [USER_GUIDE.md](./docs/USER_GUIDE.md)

```bash

cd infrastructure/docker## 🧪 Testing

docker-compose up -d

``````bash

# Run all tests

Services will be available at:./scripts/testing/test-all.sh

- Backend: http://localhost:3001

- AI Agent: http://localhost:8000# Run specific service tests

- Web: http://localhost:3000cd MediBot && npm test

cd medibot-web && npm test

### Build Individual Imagescd medibot-backend && npm test

cd AIAgent && pytest

```bash```

# Backend

docker build -t medibot-backend:latest ./medibot-backend## 📊 Architecture



# AI Agent```

docker build -t medibot-ai-agent:latest ./medibot-backend/python/aiagent┌───────────────┐     ┌───────────────┐

│  Mobile App   │     │ Web Dashboard │

# Web│ (React Native)│     │   (React)     │

docker build -t medibot-web:latest ./medibot-web└───────┬───────┘     └───────┬───────┘

```        │                     │

        └──────────┬──────────┘

## ☸️ Kubernetes Deployment                   │

           ┌───────▼───────┐

```bash           │  Backend API  │

cd infrastructure/k8s           │   (NestJS)    │

kubectl create namespace medibot           └───┬───────┬───┘

./deploy.sh               │       │

```       ┌───────┘       └────────┐

       ▼                        ▼

See [SETUP_AND_DEPLOYMENT.md](./docs/SETUP_AND_DEPLOYMENT.md#cloud-deployment-kubernetes) for detailed Kubernetes setup.

┌──────────────┐        ┌──────────────┐
│ PostgreSQL   │        │  AI Agent    │

## 🔄 CI/CD Pipeline│   Database   │        │  (FastAPI)   │

└──────────────┘        └──────┬───────┘

Automated CI/CD pipelines using GitHub Actions:                               │

                        ┌──────▼───────┐

1. **Backend CI/CD** - Lint, test, build, deploy                        │ Ollama (LLM) │

2. **AI Agent CI/CD** - Python tests, Docker build, deploy                        │  MedLlama2   │

3. **Web CI/CD** - Build optimized bundle, deploy to CDN                        └──────────────┘

4. **Mobile CI/CD** - Build iOS/Android apps, submit to stores```



### Build OrderFor detailed architecture, see [ARCHITECTURE.md](./docs/ARCHITECTURE.md).



```## 🤝 Contributing

Backend + AI Agent (parallel) → Web → Mobile

```We welcome contributions! Here's how to get started:



## 🧪 Testing1. **Read the Documentation**

   - [Development Guide](./docs/DEVELOPMENT_GUIDE.md) - Development workflows

```bash   - [Architecture](./docs/ARCHITECTURE.md) - System design

# Backend tests   - [API Reference](./docs/API_REFERENCE.md) - API documentation

cd medibot-backend

npm test2. **Set Up Development Environment**

npm run test:e2e   ```bash

npm run test:cov   # Fork the repository

   git clone https://github.com/YOUR_USERNAME/medibot.git

# Web tests   cd medibot

cd medibot-web   

npm test   # Install dependencies

   ./scripts/development/install-dependencies.sh

# Mobile tests   

cd medibot-mobile   # Start development servers

npm test   ./scripts/development/start-all.sh

```   ```



## 📊 API Documentation3. **Create a Feature Branch**

   ```bash

Once the backend is running, access API documentation:   git checkout -b feature/your-feature-name

   ```

- **Swagger UI:** http://localhost:3001/api/docs

- **OpenAPI JSON:** http://localhost:3001/api/docs-json4. **Make Your Changes**

   - Write clean, documented code

## 🔐 Security   - Follow existing code style

   - Add tests for new features

- JWT-based authentication   - Update documentation

- Role-based access control (RBAC)

- HTTPS/TLS encryption5. **Test Your Changes**

- HIPAA compliance ready   ```bash

- Data encryption at rest   # Run all tests

- Secure session management   ./scripts/testing/test-all.sh

   

## 🌍 Environment Variables   # Test specific service

   cd medibot-backend && npm test

Create `.env` files from examples:   ```



```bash6. **Submit a Pull Request**

cp medibot-backend/.env.example medibot-backend/.env   - Push your branch to GitHub

cp medibot-backend/python/aiagent/.env.example medibot-backend/python/aiagent/.env   - Create a Pull Request

cp medibot-web/.env.example medibot-web/.env.local   - Describe your changes

cp medibot-mobile/.env.example medibot-mobile/.env   - Wait for review

```

### Development Guidelines

See [SETUP_AND_DEPLOYMENT.md](./docs/SETUP_AND_DEPLOYMENT.md#environment-configuration) for configuration details.

- ✅ Follow TypeScript/Python best practices
- ✅ Write unit tests for new features

## 📈 Monitoring & Observability- ✅ Update documentation

- ✅ Keep commits focused and descriptive

- Health check endpoints- ✅ Ensure all tests pass before submitting PR

- Prometheus metrics

- Grafana dashboards## 📄 License

- Structured logging

- Error tracking with SentryMIT License - see LICENSE file for details



## 🤝 Contributing## 🆘 Support



Contributions are welcome! Please follow these steps:### Documentation

- 📚 **[Documentation Index](./docs/DOCUMENTATION_INDEX.md)** - All documentation

1. Fork the repository- 👥 **[User Guide](./docs/USER_GUIDE.md)** - For end users

2. Create a feature branch (`git checkout -b feature/amazing-feature`)- 🚀 **[Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)** - Deploy to production

3. Commit changes (`git commit -m 'Add amazing feature'`)- ❓ **[FAQ](./docs/FAQ.md)** - Common questions

4. Push to branch (`git push origin feature/amazing-feature`)- 🔧 **[Troubleshooting](./docs/TROUBLESHOOTING.md)** - Problem solving

5. Open a Pull Request

### Quick Links

## 📝 License- **[Getting Started](./docs/GETTING_STARTED.md)** - Complete setup (30 min)

- **[Quick Start](./docs/QUICK_START_GUIDE.md)** - Fast setup (10 min)

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.- **[API Reference](./docs/API_REFERENCE.md)** - API documentation

- **[Architecture](./docs/ARCHITECTURE.md)** - System design

## 👥 Team

### Community & Help

Developed and maintained by the MediBot Team.- 💬 **Discord**: [Join our community](https://discord.gg/medibot)

- 🐛 **Issues**: [GitHub Issues](https://github.com/NoelKhan/medibot/issues)

## 📞 Support- 📧 **Email**: support@medibot.com

- 🌐 **Website**: [medibot.app](https://medibot.app)

- **Issues:** [GitHub Issues](https://github.com/NoelKhan/medibot-backend/issues)
- **Documentation:** [Setup Guide](./docs/SETUP_AND_DEPLOYMENT.md)
- **Email:** support@medibot.health (coming soon)

- 🧪 **Testing**: `./scripts/testing/test-all.sh`

## 🎉 Acknowledgments- 🔍 **Health Check**: `./scripts/development/check-services.sh`



- Built with ❤️ using modern web technologies### For Medical Emergencies

- Powered by Ollama for AI capabilities**⚠️ IMPORTANT**: MediBot is a triage tool, not a replacement for medical care.

- Inspired by healthcare innovation- 🚨 **For emergencies**: Call 911 (US) or your local emergency number

- 🏥 **For urgent care**: Visit nearest emergency room

---- 👨‍⚕️ **For medical advice**: Consult licensed healthcare provider



**Ready to revolutionize healthcare? Let's build together! 🚀**---



For detailed setup instructions, see **[SETUP_AND_DEPLOYMENT.md](./docs/SETUP_AND_DEPLOYMENT.md)**

---

**Built with ❤️ by the MediBot Team**

