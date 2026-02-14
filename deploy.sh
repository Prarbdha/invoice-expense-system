#!/bin/bash

# Build backend
echo "Building backend..."
cd server
npm install
npx prisma generate
npm run build
cd ..

# Build frontend
echo "Building frontend..."
cd client
npm install
npm run build
cd ..

echo "Build complete!"