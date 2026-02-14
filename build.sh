#!/bin/bash

echo "🔨 Building application..."

# Build backend
echo "📦 Building backend..."
cd server
npm install
npx prisma generate
npm run build

# Build frontend
echo "🎨 Building frontend..."
cd ../client
npm install
npm run build

echo "✅ Build complete!"