# Build and Deploy Script for Gym Frontend (PowerShell)

param(
    [switch]$SkipBuild,
    [switch]$RunLocal,
    [string]$Tag = "latest"
)

# Colors for output
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

function Write-Status {
    param([string]$Message)
    Write-Host "${Blue}[INFO]${Reset} $Message"
}

function Write-Success {
    param([string]$Message)
    Write-Host "${Green}[SUCCESS]${Reset} $Message"
}

function Write-Warning {
    param([string]$Message)
    Write-Host "${Yellow}[WARNING]${Reset} $Message"
}

function Write-Error {
    param([string]$Message)
    Write-Host "${Red}[ERROR]${Reset} $Message"
}

Write-Host "🏗️  Building Gym Frontend for Production..." -ForegroundColor Cyan

# Check if Docker is installed
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker is not installed. Please install Docker Desktop first."
    exit 1
}

# Build the Docker image
if (-not $SkipBuild) {
    Write-Status "Building Docker image..."
    docker build -t gym-frontend:$Tag .
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Docker image built successfully!"
    } else {
        Write-Error "Failed to build Docker image"
        exit 1
    }
}

# Optional: Run the container locally for testing
if ($RunLocal) {
    Write-Status "Starting container on port 3000..."
    
    # Stop existing container if running
    docker stop gym-frontend-test 2>$null
    docker rm gym-frontend-test 2>$null
    
    docker run -d --name gym-frontend-test -p 3000:3000 gym-frontend:$Tag
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Container started! Visit http://localhost:3000"
        Write-Warning "Remember to stop the container with: docker stop gym-frontend-test"
    } else {
        Write-Error "Failed to start container"
        exit 1
    }
}

Write-Success "Build process completed!"
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Test your application at http://localhost:3000 (if running locally)"
Write-Host "   2. Push to your container registry:"
Write-Host "      docker tag gym-frontend:$Tag your-registry/gym-frontend:$Tag"
Write-Host "      docker push your-registry/gym-frontend:$Tag"
Write-Host "   3. Deploy to your production environment"
Write-Host ""
Write-Host "🔧 Usage examples:" -ForegroundColor Cyan
Write-Host "   .\build-and-deploy.ps1                    # Build only"
Write-Host "   .\build-and-deploy.ps1 -RunLocal          # Build and run locally"
Write-Host "   .\build-and-deploy.ps1 -Tag v1.0.0        # Build with specific tag"
Write-Host "   .\build-and-deploy.ps1 -SkipBuild -RunLocal # Run existing image"
