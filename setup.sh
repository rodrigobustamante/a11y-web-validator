#!/bin/bash

# A11yScan Setup Script
# This script helps you set up the development environment

set -e

echo "🚀 A11yScan Setup Script"
echo "========================="
echo ""

# Check Node version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Error: Node.js 18 or higher is required. You have $(node -v)"
  exit 1
fi
echo "✅ Node.js version OK: $(node -v)"
echo ""

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
  echo "📦 PNPM not found. Installing pnpm..."
  npm install -g pnpm
  echo "✅ PNPM installed"
else
  echo "✅ PNPM already installed: $(pnpm -v)"
fi
echo ""

# Install dependencies
echo "📥 Installing dependencies with pnpm..."
pnpm install
echo "✅ Dependencies installed"
echo ""

# Install Playwright browsers (from the API workspace where Playwright is installed)
echo "🎭 Installing Playwright browsers..."
cd apps/api
pnpm exec playwright install chromium
cd ../..
echo "✅ Playwright browsers installed"
echo ""

# Create .env files if they don't exist
echo "🔧 Setting up environment files..."

if [ ! -f "apps/api/.env" ]; then
  cat > apps/api/.env << EOF
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:3000
EOF
  echo "✅ Created apps/api/.env"
else
  echo "⏭️  apps/api/.env already exists"
fi

if [ ! -f "apps/web/.env.local" ]; then
  cat > apps/web/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF
  echo "✅ Created apps/web/.env.local"
else
  echo "⏭️  apps/web/.env.local already exists"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "To start development:"
echo "  pnpm dev             # Start both frontend and backend"
echo ""
echo "Or run them separately:"
echo "  cd apps/web && pnpm dev       # Frontend only (port 3000)"
echo "  cd apps/api && pnpm dev       # Backend only (port 3001)"
echo ""
echo "Happy coding! 🎉"

