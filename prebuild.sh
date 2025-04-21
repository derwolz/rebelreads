#!/bin/bash
# This script runs before the standard build process to prepare the environment

echo "🚀 Running pre-build script..."

# Make sure uploads directory exists
mkdir -p uploads/covers
mkdir -p uploads/profile-images
mkdir -p uploads/temp

echo "✅ Created uploads directories"

# The standard build will run after this script completes