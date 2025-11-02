#!/bin/bash

# ============================================
# MediBot Backend - Quick Start Script
# ============================================
# Automates the initial setup process

set -e  # Exit on error

echo "🏥 ============================================"
echo "   MediBot Backend - Quick Start"
echo "   ============================================"
echo ""

# Check if Docker is running
echo "📦 Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi
echo "✅ Docker is running"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Update LOCAL_IP in .env with your computer's IP address"
    echo "   Find your IP:"
    echo "   - macOS/Linux: ifconfig | grep 'inet ' | grep -v 127.0.0.1"
    echo "   - Windows: ipconfig"
    echo ""
    read -p "Press Enter to continue..."
fi

# Start Docker containers
echo "🐳 Starting Docker containers..."
echo "   - PostgreSQL (port 5432)"
echo "   - Redis (port 6379)"
echo "   - pgAdmin (port 5050)"
echo ""
docker-compose up -d

echo ""
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Check if containers are running
if ! docker ps | grep -q "medibot-postgres"; then
    echo "❌ PostgreSQL failed to start. Check Docker logs:"
    echo "   docker-compose logs postgres"
    exit 1
fi

echo "✅ All containers are running"
echo ""

echo "🎉 ============================================"
echo "   Setup Complete!"
echo "   ============================================"
echo ""
echo "📚 Next Steps:"
echo ""
echo "1. Run migrations to create database tables:"
echo "   npm run migration:run"
echo ""
echo "2. (Optional) Load sample data for testing:"
echo "   npm run seed:dev"
echo ""
echo "3. Start the backend server:"
echo "   npm run start:dev"
echo ""
echo "4. Access services:"
echo "   🌐 API Server: http://localhost:3000"
echo "   📚 API Docs: http://localhost:3000/api/docs"
echo "   🗄️ pgAdmin: http://localhost:5050"
echo "      Login: admin@medibot.local / admin"
echo ""
echo "5. To stop containers:"
echo "   npm run docker:down"
echo ""
echo "============================================"
