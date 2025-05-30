#!/bin/bash

# Docker Build Script for Rival Outranker
echo "🚀 Building Rival Outranker Docker containers..."

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Remove existing images to ensure fresh build
echo "🧹 Removing existing images..."
docker image prune -f
docker rmi rival-outranker-frontend rival-outranker-backend 2>/dev/null || true

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up --build -d

# Check service status
echo "📊 Checking service status..."
sleep 10
docker-compose ps

# Check logs
echo "📋 Backend logs:"
docker-compose logs backend | tail -20

echo "📋 Frontend logs:"
docker-compose logs frontend | tail -20

echo "📋 PostgreSQL logs:"
docker-compose logs postgres | tail -10

echo "📋 Redis logs:"
docker-compose logs redis | tail -10

# Test health endpoints
echo "🩺 Testing health endpoints..."
echo "Backend health:"
curl -f http://localhost:8080/health || echo "Backend health check failed"

echo "Frontend health:"
curl -f http://localhost:3000/api/health || echo "Frontend health check failed"

echo "✅ Build script completed!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:8080"
echo "📚 API Docs: http://localhost:8080/api-docs" 