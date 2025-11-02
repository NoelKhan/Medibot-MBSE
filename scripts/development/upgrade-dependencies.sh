#!/bin/bash

# Dependency Upgrade Script
# Upgrades all dependencies across Mobile, Web, Backend, and AI Agent
# Run after reorganization: ./upgrade-dependencies.sh

set -e  # Exit on error

echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║           📦 MediBot Dependency Upgrade Script                           ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo ""

# Check if running from correct directory
if [ ! -d "MediBot" ] && [ ! -d "medibot-web" ] && [ ! -d "medibot-backend" ]; then
    echo "❌ Error: Please run this script from the root directory"
    echo "   Current directory: $(pwd)"
    exit 1
fi

echo "📂 Current directory: $(pwd)"
echo ""

# Confirm before proceeding
read -p "⚠️  This will upgrade dependencies across all projects. Continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Aborted by user"
    exit 0
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║                     📱 MOBILE APP (React Native)                         ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo ""

if [ -d "MediBot" ]; then
    cd MediBot
    echo "🔍 Checking current dependencies..."
    npm outdated || true
    echo ""
    
    echo "⬆️  Upgrading axios..."
    npm install axios@latest
    echo "   ✅ axios upgraded"
    echo ""
    
    echo "⬆️  Updating other dependencies (minor/patch versions)..."
    npm update
    echo "   ✅ Dependencies updated"
    echo ""
    
    echo "🧹 Cleaning up..."
    npm audit fix || true
    echo "   ✅ Security audit completed"
    echo ""
    
    echo "✅ Mobile app dependencies upgraded"
    cd ..
else
    echo "⚠️  MediBot directory not found, skipping..."
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║                     🌐 WEB DASHBOARD (React)                             ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo ""

if [ -d "medibot-web" ]; then
    cd medibot-web
    echo "🔍 Checking current dependencies..."
    npm outdated || true
    echo ""
    
    echo "⚠️  IMPORTANT: React 19 Compatibility Check"
    echo "   Current React version: $(npm list react --depth=0 2>/dev/null | grep react@ || echo 'Unknown')"
    echo ""
    read -p "   Downgrade to React 18 LTS for stability? (recommended/yes or no): " react_downgrade
    
    if [ "$react_downgrade" = "recommended" ] || [ "$react_downgrade" = "yes" ]; then
        echo "   ⬇️  Downgrading to React 18 LTS..."
        npm install react@^18.3.1 react-dom@^18.3.1
        npm install --save-dev @types/react@^18.3.12 @types/react-dom@^18.3.1
        echo "   ✅ React downgraded to 18.3.1 LTS"
    else
        echo "   ℹ️  Keeping React 19 (ensure all dependencies are compatible)"
    fi
    echo ""
    
    echo "⬆️  Updating other dependencies..."
    npm update
    echo "   ✅ Dependencies updated"
    echo ""
    
    echo "🧹 Cleaning up..."
    npm audit fix || true
    echo "   ✅ Security audit completed"
    echo ""
    
    echo "✅ Web dashboard dependencies upgraded"
    cd ..
else
    echo "⚠️  medibot-web directory not found, skipping..."
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║                     ⚙️  BACKEND API (NestJS)                             ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo ""

if [ -d "medibot-backend" ]; then
    cd medibot-backend
    echo "🔍 Checking current dependencies..."
    npm outdated || true
    echo ""
    
    echo "⬆️  Updating dependencies..."
    npm update
    echo "   ✅ Dependencies updated"
    echo ""
    
    echo "🧹 Cleaning up..."
    npm audit fix || true
    echo "   ✅ Security audit completed"
    echo ""
    
    echo "✅ Backend API dependencies upgraded"
    cd ..
else
    echo "⚠️  medibot-backend directory not found, skipping..."
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║                     🤖 AI AGENT (Python/FastAPI)                         ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo ""

if [ -d "AIAgent" ]; then
    cd AIAgent
    
    echo "🔍 Checking Python version..."
    python_version=$(python3 --version 2>&1 | awk '{print $2}')
    echo "   Python version: $python_version"
    echo ""
    
    echo "📝 Creating clean requirements.txt..."
    cat > requirements.txt << 'EOFREQ'
# Core LangChain
langchain>=0.3.0
langgraph>=0.2.28
langchain-community>=0.3.0

# Vector Store & Embeddings
faiss-cpu>=1.9.0
sentence-transformers>=3.2.1

# Data Validation
pydantic>=2.10.0

# Scientific Computing
numpy>=2.1.0

# LLM Integration
ollama>=0.4.0
openai>=1.57.0
tiktoken>=0.8.0

# Web Framework
fastapi>=0.115.0
uvicorn>=0.32.0

# Optional: UI (if needed)
streamlit>=1.40.0
streamlit-chat>=0.1.3
EOFREQ
    echo "   ✅ Created clean requirements.txt"
    echo ""
    
    echo "⬆️  Upgrading Python packages..."
    if [ -d "../.venv" ]; then
        echo "   Using virtual environment at ../.venv"
        source ../.venv/bin/activate
    elif [ -d ".venv" ]; then
        echo "   Using virtual environment at .venv"
        source .venv/bin/activate
    fi
    
    pip3 install --upgrade pip
    pip3 install --upgrade -r requirements.txt
    echo "   ✅ Python packages upgraded"
    echo ""
    
    echo "📋 Freezing exact versions..."
    pip3 freeze > requirements-lock.txt
    echo "   ✅ Created requirements-lock.txt with exact versions"
    echo ""
    
    echo "✅ AI Agent dependencies upgraded"
    cd ..
else
    echo "⚠️  AIAgent directory not found, skipping..."
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║                     📦 SHARED PACKAGE                                     ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo ""

# Check both possible locations
SHARED_DIR=""
if [ -d "packages/shared" ]; then
    SHARED_DIR="packages/shared"
elif [ -d "shared" ]; then
    SHARED_DIR="shared"
fi

if [ -n "$SHARED_DIR" ]; then
    cd "$SHARED_DIR"
    echo "🔍 Checking shared package dependencies..."
    if [ -f "package.json" ]; then
        npm outdated || true
        echo ""
        
        echo "⬆️  Updating dependencies..."
        npm update
        echo "   ✅ Dependencies updated"
        echo ""
    else
        echo "   ℹ️  No package.json found, skipping..."
    fi
    
    echo "✅ Shared package checked"
    cd - > /dev/null
else
    echo "⚠️  Shared package not found, skipping..."
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║                     ✅ UPGRADE COMPLETE                                   ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo ""

echo "📊 Summary:"
echo ""
echo "   ✅ Mobile (MediBot):"
echo "      - axios upgraded to latest"
echo "      - All dependencies updated"
echo ""
echo "   ✅ Web (medibot-web):"
if [ "$react_downgrade" = "recommended" ] || [ "$react_downgrade" = "yes" ]; then
    echo "      - React downgraded to 18.3.1 LTS"
else
    echo "      - React kept at 19.x"
fi
echo "      - All dependencies updated"
echo ""
echo "   ✅ Backend (medibot-backend):"
echo "      - All dependencies updated"
echo "      - Security audit completed"
echo ""
echo "   ✅ AI Agent (AIAgent):"
echo "      - Clean requirements.txt created"
echo "      - All Python packages upgraded"
echo "      - requirements-lock.txt created"
echo ""

echo "🧪 Next Steps:"
echo ""
echo "   1. Test Mobile App:"
echo "      cd MediBot"
echo "      npm test"
echo "      npm start"
echo ""
echo "   2. Test Web Dashboard:"
echo "      cd medibot-web"
echo "      npm test"
echo "      npm run dev"
echo ""
echo "   3. Test Backend API:"
echo "      cd medibot-backend"
echo "      npm test"
echo "      npm run start:dev"
echo ""
echo "   4. Test AI Agent:"
echo "      cd AIAgent"
echo "      pytest"
echo "      python main.py"
echo ""
echo "   5. Run Integration Tests:"
echo "      ./scripts/testing/test-all.sh"
echo ""

echo "⚠️  IMPORTANT:"
echo "   • Test each service individually before deploying"
echo "   • Check for breaking changes in major version upgrades"
echo "   • Review release notes for React, NestJS, and LangChain"
echo "   • Update documentation if APIs changed"
echo ""

echo "📚 For issues, see:"
echo "   - docs/TROUBLESHOOTING.md"
echo "   - docs/FAQ.md"
echo ""
