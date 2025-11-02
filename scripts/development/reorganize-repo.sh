#!/bin/bash

# Repository Reorganization Script
# This script reorganizes the MediBot monorepo structure
# Run from the root directory: ./reorganize-repo.sh

set -e  # Exit on error

echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║           🔧 MediBot Repository Reorganization Script                   ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo ""

# Check if running from correct directory
if [ ! -d "MediBot" ] || [ ! -d "medibot-web" ] || [ ! -d "medibot-backend" ]; then
    echo "❌ Error: Please run this script from the root directory"
    echo "   Current directory: $(pwd)"
    exit 1
fi

echo "📂 Current directory: $(pwd)"
echo ""

# Confirm before proceeding
read -p "⚠️  This will reorganize your repository structure. Continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Aborted by user"
    exit 0
fi

echo ""
echo "🔍 Step 1: Creating backup..."
BACKUP_DIR="../rn-backup-$(date +%Y%m%d-%H%M%S)"
echo "   Creating backup at: $BACKUP_DIR"
cp -r . "$BACKUP_DIR"
echo "   ✅ Backup created successfully"
echo ""

echo "📁 Step 2: Creating new directory structure..."
mkdir -p docs
mkdir -p infrastructure/docker
mkdir -p infrastructure/k8s
mkdir -p scripts/deployment
mkdir -p scripts/development
mkdir -p scripts/testing
mkdir -p scripts/utilities
mkdir -p packages
echo "   ✅ Directories created"
echo ""

echo "📚 Step 3: Moving documentation files..."
if [ -f "GETTING_STARTED.md" ]; then mv GETTING_STARTED.md docs/; echo "   ✅ Moved GETTING_STARTED.md"; fi
if [ -f "QUICK_START_GUIDE.md" ]; then mv QUICK_START_GUIDE.md docs/; echo "   ✅ Moved QUICK_START_GUIDE.md"; fi
if [ -f "FAQ.md" ]; then mv FAQ.md docs/; echo "   ✅ Moved FAQ.md"; fi
if [ -f "TROUBLESHOOTING.md" ]; then mv TROUBLESHOOTING.md docs/; echo "   ✅ Moved TROUBLESHOOTING.md"; fi
if [ -f "DEVELOPMENT_GUIDE.md" ]; then mv DEVELOPMENT_GUIDE.md docs/; echo "   ✅ Moved DEVELOPMENT_GUIDE.md"; fi
if [ -f "API_REFERENCE.md" ]; then mv API_REFERENCE.md docs/; echo "   ✅ Moved API_REFERENCE.md"; fi
if [ -f "ARCHITECTURE.md" ]; then mv ARCHITECTURE.md docs/; echo "   ✅ Moved ARCHITECTURE.md"; fi
if [ -f "CHANGELOG.md" ]; then mv CHANGELOG.md docs/; echo "   ✅ Moved CHANGELOG.md"; fi
if [ -f "DOCUMENTATION_INDEX.md" ]; then mv DOCUMENTATION_INDEX.md docs/; echo "   ✅ Moved DOCUMENTATION_INDEX.md"; fi
if [ -f "DOCUMENTATION_COMPLETE.md" ]; then mv DOCUMENTATION_COMPLETE.md docs/; echo "   ✅ Moved DOCUMENTATION_COMPLETE.md"; fi
if [ -f "REORGANIZATION_PLAN.md" ]; then mv REORGANIZATION_PLAN.md docs/; echo "   ✅ Moved REORGANIZATION_PLAN.md"; fi

# Backup original README and create new one
if [ -f "README.md" ]; then 
    mv README.md docs/README-original.md
    echo "   ✅ Backed up original README.md"
fi
echo ""

echo "🔧 Step 4: Moving deployment scripts..."
if [ -f "deploy-production.sh" ]; then mv deploy-production.sh scripts/deployment/; echo "   ✅ Moved deploy-production.sh"; fi
if [ -f "setup-github-secrets.sh" ]; then mv setup-github-secrets.sh scripts/deployment/; echo "   ✅ Moved setup-github-secrets.sh"; fi
if [ -f "scripts/deploy-k8s.sh" ]; then mv scripts/deploy-k8s.sh scripts/deployment/; echo "   ✅ Moved deploy-k8s.sh"; fi
if [ -f "scripts/deploy.sh" ]; then mv scripts/deploy.sh scripts/deployment/; echo "   ✅ Moved deploy.sh"; fi
echo ""

echo "💻 Step 5: Moving development scripts..."
if [ -f "install-dependencies.sh" ]; then mv install-dependencies.sh scripts/development/; echo "   ✅ Moved install-dependencies.sh"; fi
if [ -f "check-services.sh" ]; then mv check-services.sh scripts/development/; echo "   ✅ Moved check-services.sh"; fi
if [ -f "scripts/start-all.sh" ]; then mv scripts/start-all.sh scripts/development/; echo "   ✅ Moved start-all.sh"; fi
if [ -f "scripts/stop-all.sh" ]; then mv scripts/stop-all.sh scripts/development/; echo "   ✅ Moved stop-all.sh"; fi
echo ""

echo "🧪 Step 6: Moving testing scripts..."
if [ -f "test-all.sh" ]; then mv test-all.sh scripts/testing/; echo "   ✅ Moved test-all.sh"; fi
if [ -f "test-integration.sh" ]; then mv test-integration.sh scripts/testing/; echo "   ✅ Moved test-integration.sh"; fi
if [ -f "test-ai-agent.sh" ]; then mv test-ai-agent.sh scripts/testing/; echo "   ✅ Moved test-ai-agent.sh"; fi
echo ""

echo "🛠️  Step 7: Moving utility scripts..."
if [ -f "status-check.sh" ]; then mv status-check.sh scripts/utilities/; echo "   ✅ Moved status-check.sh"; fi
if [ -f "show-summary.sh" ]; then mv show-summary.sh scripts/utilities/; echo "   ✅ Moved show-summary.sh"; fi
if [ -f "scripts/cleanup-docs.sh" ]; then mv scripts/cleanup-docs.sh scripts/utilities/; echo "   ✅ Moved cleanup-docs.sh"; fi
if [ -f "scripts/ota-update.sh" ]; then mv scripts/ota-update.sh scripts/utilities/; echo "   ✅ Moved ota-update.sh"; fi
echo ""

echo "⚙️  Step 8: Moving infrastructure files..."
if [ -d "k8s" ]; then 
    mv k8s/* infrastructure/k8s/ 2>/dev/null || true
    rmdir k8s 2>/dev/null || true
    echo "   ✅ Moved k8s/ to infrastructure/k8s/"
fi
if [ -f "docker-compose.yml" ]; then mv docker-compose.yml infrastructure/docker/; echo "   ✅ Moved docker-compose.yml"; fi
echo ""

echo "📦 Step 9: Moving shared package..."
if [ -d "shared" ]; then 
    mv shared packages/
    echo "   ✅ Moved shared/ to packages/shared/"
fi
echo ""

echo "🗑️  Step 10: Cleaning up unnecessary files..."
if [ -f "deploy-output.log" ]; then rm -f deploy-output.log; echo "   ✅ Deleted deploy-output.log"; fi
if [ -f "deployment-20251028-053421.log" ]; then rm -f deployment-20251028-053421.log; echo "   ✅ Deleted deployment-20251028-053421.log"; fi
if [ -f ".DS_Store" ]; then rm -f .DS_Store; echo "   ✅ Deleted .DS_Store"; fi
# Remove old empty scripts folder if it exists
if [ -d "scripts" ] && [ -z "$(ls -A scripts)" ]; then 
    rmdir scripts
    echo "   ✅ Removed empty scripts/ folder"
fi
echo ""

echo "📝 Step 11: Creating new root README.md..."
cat > README.md << 'EOFREADME'
# MediBot - AI-Powered Emergency Triage Platform

**Monorepo** containing all MediBot services and infrastructure.

## 🚀 Quick Start

```bash
# Start all services
./scripts/development/start-all.sh

# Check service health
./scripts/development/check-services.sh

# Run tests
./scripts/testing/test-all.sh
```

## 📦 Projects

| Service | Path | Description |
|---------|------|-------------|
| **Mobile App** | [MediBot/](./MediBot/) | React Native iOS/Android app |
| **Web Dashboard** | [medibot-web/](./medibot-web/) | React web application |
| **Backend API** | [medibot-backend/](./medibot-backend/) | NestJS REST API |
| **AI Agent** | [AIAgent/](./AIAgent/) | FastAPI AI service |

## 📚 Documentation

Complete documentation is available in the [docs/](./docs/) directory:

- **[Getting Started](./docs/GETTING_STARTED.md)** - Complete setup guide (30 min)
- **[Quick Start Guide](./docs/QUICK_START_GUIDE.md)** - Fast setup (10 min)
- **[API Reference](./docs/API_REFERENCE.md)** - Complete API documentation
- **[Architecture](./docs/ARCHITECTURE.md)** - System architecture
- **[Development Guide](./docs/DEVELOPMENT_GUIDE.md)** - Development workflows
- **[FAQ](./docs/FAQ.md)** - Frequently asked questions
- **[Troubleshooting](./docs/TROUBLESHOOTING.md)** - Problem solving guide

📋 **[Documentation Index](./docs/DOCUMENTATION_INDEX.md)** - Complete documentation navigation

## 🏗️ Repository Structure

```
medibot/
├── docs/                    # All documentation
├── MediBot/                 # Mobile app (React Native)
├── medibot-web/             # Web dashboard (React)
├── medibot-backend/         # Backend API (NestJS)
├── AIAgent/                 # AI service (FastAPI)
├── infrastructure/          # Infrastructure configs
│   ├── k8s/                # Kubernetes manifests
│   └── docker/             # Docker configs
├── packages/                # Shared packages
│   └── shared/             # Shared TypeScript types
├── scripts/                 # Automation scripts
│   ├── deployment/         # Deployment scripts
│   ├── development/        # Development scripts
│   ├── testing/            # Testing scripts
│   └── utilities/          # Utility scripts
└── tests/                   # Integration tests
```

## 🛠️ Development

### Prerequisites

- **Node.js 18+** (22.2.0 recommended)
- **Python 3.11+**
- **PostgreSQL 14+**
- **Docker** (for Ollama)
- **Git**

### Setup

```bash
# Install all dependencies
./scripts/development/install-dependencies.sh

# Start services
./scripts/development/start-all.sh

# Verify everything is running
./scripts/development/check-services.sh
```

### Available Scripts

**Development:**
- `scripts/development/start-all.sh` - Start all services
- `scripts/development/stop-all.sh` - Stop all services
- `scripts/development/check-services.sh` - Health check
- `scripts/development/install-dependencies.sh` - Install deps

**Testing:**
- `scripts/testing/test-all.sh` - Run all tests
- `scripts/testing/test-integration.sh` - Integration tests
- `scripts/testing/test-ai-agent.sh` - AI agent tests

**Deployment:**
- `scripts/deployment/deploy-production.sh` - Deploy to production
- `scripts/deployment/deploy-k8s.sh` - Deploy to Kubernetes
- `scripts/deployment/setup-github-secrets.sh` - Setup secrets

**Utilities:**
- `scripts/utilities/status-check.sh` - System status
- `scripts/utilities/show-summary.sh` - Show summary
- `scripts/utilities/cleanup-docs.sh` - Cleanup docs

## 🚀 Deployment

### Local Development

```bash
docker-compose -f infrastructure/docker/docker-compose.yml up -d
```

### Kubernetes

```bash
cd infrastructure/k8s
kubectl apply -f .
```

See [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md) for detailed instructions.

## 🧪 Testing

```bash
# Run all tests
./scripts/testing/test-all.sh

# Run specific service tests
cd MediBot && npm test
cd medibot-web && npm test
cd medibot-backend && npm test
cd AIAgent && pytest
```

## 📊 Architecture

```
┌───────────────┐     ┌───────────────┐
│  Mobile App   │     │ Web Dashboard │
│ (React Native)│     │   (React)     │
└───────┬───────┘     └───────┬───────┘
        │                     │
        └──────────┬──────────┘
                   │
           ┌───────▼───────┐
           │  Backend API  │
           │   (NestJS)    │
           └───┬───────┬───┘
               │       │
       ┌───────┘       └────────┐
       ▼                        ▼
┌──────────────┐        ┌──────────────┐
│ PostgreSQL   │        │  AI Agent    │
│   Database   │        │  (FastAPI)   │
└──────────────┘        └──────┬───────┘
                               │
                        ┌──────▼───────┐
                        │ Ollama (LLM) │
                        │  MedLlama2   │
                        └──────────────┘
```

For detailed architecture, see [ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## 🤝 Contributing

1. Read the [Development Guide](./docs/DEVELOPMENT_GUIDE.md)
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Documentation**: [docs/](./docs/)
- **FAQ**: [docs/FAQ.md](./docs/FAQ.md)
- **Troubleshooting**: [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)
- **Issues**: GitHub Issues

---

**Built with ❤️ by the MediBot Team**
EOFREADME

echo "   ✅ Created new README.md"
echo ""

echo "🔄 Step 12: Updating script paths..."
# Update paths in scripts that reference other scripts or directories

# Update start-all.sh
if [ -f "scripts/development/start-all.sh" ]; then
    sed -i.bak 's|./check-services.sh|./scripts/development/check-services.sh|g' scripts/development/start-all.sh
    rm -f scripts/development/start-all.sh.bak
    echo "   ✅ Updated start-all.sh"
fi

# Update deploy-k8s.sh
if [ -f "scripts/deployment/deploy-k8s.sh" ]; then
    sed -i.bak 's|k8s/|infrastructure/k8s/|g' scripts/deployment/deploy-k8s.sh
    rm -f scripts/deployment/deploy-k8s.sh.bak
    echo "   ✅ Updated deploy-k8s.sh"
fi

# Make all scripts executable
chmod +x scripts/deployment/*.sh 2>/dev/null || true
chmod +x scripts/development/*.sh 2>/dev/null || true
chmod +x scripts/testing/*.sh 2>/dev/null || true
chmod +x scripts/utilities/*.sh 2>/dev/null || true
echo "   ✅ Made all scripts executable"
echo ""

echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║                    ✅ REORGANIZATION COMPLETE                            ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Summary:"
echo "   ✅ Backup created at: $BACKUP_DIR"
echo "   ✅ Documentation moved to docs/"
echo "   ✅ Scripts organized into categories"
echo "   ✅ Infrastructure moved to infrastructure/"
echo "   ✅ Shared package moved to packages/"
echo "   ✅ Unnecessary files removed"
echo "   ✅ New root README created"
echo ""
echo "📂 New Structure:"
echo "   medibot/"
echo "   ├── docs/                  (11 documentation files)"
echo "   ├── MediBot/               (Mobile app)"
echo "   ├── medibot-web/           (Web dashboard)"
echo "   ├── medibot-backend/       (Backend API)"
echo "   ├── AIAgent/               (AI service)"
echo "   ├── infrastructure/"
echo "   │   ├── k8s/              (Kubernetes configs)"
echo "   │   └── docker/           (Docker configs)"
echo "   ├── packages/shared/       (Shared types)"
echo "   ├── scripts/"
echo "   │   ├── deployment/       (4 scripts)"
echo "   │   ├── development/      (4 scripts)"
echo "   │   ├── testing/          (3 scripts)"
echo "   │   └── utilities/        (4 scripts)"
echo "   └── tests/                 (Integration tests)"
echo ""
echo "🚀 Next Steps:"
echo "   1. Review new structure: ls -la"
echo "   2. Test scripts: ./scripts/development/check-services.sh"
echo "   3. Update git remotes if needed"
echo "   4. Upgrade dependencies: see docs/REORGANIZATION_PLAN.md"
echo "   5. Run tests: ./scripts/testing/test-all.sh"
echo ""
echo "📚 Documentation: cat docs/DOCUMENTATION_INDEX.md"
echo "📋 Full plan: cat docs/REORGANIZATION_PLAN.md"
echo ""
