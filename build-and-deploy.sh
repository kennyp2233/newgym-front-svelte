#!/bin/bash

# Build and Deploy Script for Gym Frontend

set -e  # Exit on any error

echo "🏗️  Building Gym Frontend for Production..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Build the Docker image
print_status "Building Docker image..."
docker build -t gym-frontend:latest .

if [ $? -eq 0 ]; then
    print_success "Docker image built successfully!"
else
    print_error "Failed to build Docker image"
    exit 1
fi

# Optional: Tag for production
read -p "Do you want to tag this image for production? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter production tag (e.g., v1.0.0): " PROD_TAG
    docker tag gym-frontend:latest gym-frontend:$PROD_TAG
    print_success "Image tagged as gym-frontend:$PROD_TAG"
fi

# Optional: Run the container locally for testing
read -p "Do you want to run the container locally for testing? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Starting container on port 3000..."
    docker run -d --name gym-frontend-test -p 3000:3000 gym-frontend:latest
    print_success "Container started! Visit http://localhost:3000"
    print_warning "Remember to stop the container with: docker stop gym-frontend-test"
fi

print_success "Build process completed!"
echo
echo "📝 Next steps:"
echo "   1. Test your application at http://localhost:3000 (if running locally)"
echo "   2. Push to your container registry:"
echo "      docker tag gym-frontend:latest your-registry/gym-frontend:latest"
echo "      docker push your-registry/gym-frontend:latest"
echo "   3. Deploy to your production environment"
