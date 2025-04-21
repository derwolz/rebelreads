#!/bin/bash
# This script runs after the standard build process to finalize the build

echo "🚀 Running post-build script..."

# Create the dist/uploads directory if it doesn't exist
mkdir -p dist/uploads

# Copy the uploads directory contents to dist/uploads
cp -r uploads/* dist/uploads/ 2>/dev/null || true

echo "✅ Copied uploads directory to dist/uploads"

# Create an .env file in the dist directory with NODE_ENV=production
echo "NODE_ENV=production" > dist/.env

echo "✅ Created environment file"

echo "✅ Build complete!"