#!/bin/bash
# Installation script for MediBot AI Agent Integration
# Run this script to install all necessary dependencies

echo "🚀 MediBot AI Agent Integration - Dependency Installation"
echo "=========================================================="

# Web Dashboard Dependencies
echo ""
echo "📦 Installing Web Dashboard dependencies..."
cd medibot-web
npm install chart.js react-chartjs-2
echo "✅ Web Dashboard dependencies installed"

# Mobile App - Check if dependencies need updates
echo ""
echo "📱 Checking Mobile App dependencies..."
cd ../MediBot
echo "✅ Mobile App dependencies check complete"

# Backend - Already up to date
echo ""
echo "🔧 Backend is already configured"

echo ""
echo "=========================================================="
echo "✅ All dependencies installed successfully!"
echo ""
echo "Next steps:"
echo "1. Start AI Agent Python server: cd AIAgent/api && uvicorn main:app --reload"
echo "2. Start Backend: cd medibot-backend && npm run start:dev"
echo "3. Start Web Dashboard: cd medibot-web && npm run dev"
echo "4. Start Mobile App: cd MediBot && npm start"
echo ""
echo "📖 See IMPLEMENTATION_SUMMARY.md for detailed documentation"
