#!/bin/bash
# Quick setup for Bun + Vite (fastest immediate improvement)

echo "🚀 Setting up Bun for faster Vite dev server..."

# Install Bun if not installed
if ! command -v bun &> /dev/null; then
    echo "📦 Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
fi

echo "✅ Bun installed: $(bun --version)"

# Install dependencies with Bun (much faster)
echo "📦 Installing dependencies with Bun..."
bun install

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Quick Start Commands:"
echo "  bun --bun vite              # Dev server (4x faster)"
echo "  bun run build               # Production build"
echo "  bun vite preview            # Preview build"
echo ""
echo "💡 Add to package.json scripts:"
echo '  "dev": "bun --bun vite"'
echo '  "dev:node": "vite"  # Fallback to Node'
