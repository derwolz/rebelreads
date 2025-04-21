#!/bin/bash
# This script runs after the default build script to copy uploads directory to dist

# Create uploads directory in dist if it doesn't exist
mkdir -p dist/uploads

# Copy all uploads to dist/uploads
cp -r uploads/* dist/uploads/ 2>/dev/null || :

echo "✅ Copied uploads directory to dist/uploads"