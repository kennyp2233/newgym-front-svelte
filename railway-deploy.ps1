# Railway Deployment Script for PowerShell
# Este script facilita el deployment a Railway

param(
    [string]$ProjectName = "gym-frontend",
    [switch]$Setup,
    [switch]$Deploy,
    [switch]$Logs,
    [switch]$Status
)

Write-Host "🚄 Railway Deployment Helper" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Verificar si Railway CLI está instalado
try {
    railway --version | Out-Null
    Write-Host "✅ Railway CLI encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI no encontrado. Instalando..." -ForegroundColor Red
    Write-Host "Ejecuta: npm install -g @railway/cli" -ForegroundColor Yellow
    exit 1
}

if ($Setup) {
    Write-Host "🔧 Configurando proyecto Railway..." -ForegroundColor Yellow
    
    # Login a Railway
    Write-Host "1. Iniciando sesión en Railway..." -ForegroundColor Blue
    railway login
    
    # Crear o linkar proyecto
    Write-Host "2. Creando/vinculando proyecto..." -ForegroundColor Blue
    railway link
    
    Write-Host "3. Configurando variables de entorno..." -ForegroundColor Blue
    Write-Host "Por favor configura estas variables en Railway Dashboard:" -ForegroundColor Yellow
    Write-Host "  - AUTH0_CLIENT_ID" -ForegroundColor White
    Write-Host "  - AUTH0_CLIENT_SECRET" -ForegroundColor White  
    Write-Host "  - AUTH0_DOMAIN" -ForegroundColor White
    Write-Host "  - AUTH_SECRET (genera uno aleatorio)" -ForegroundColor White
    Write-Host "  - NODE_ENV=production" -ForegroundColor White
    
    railway open
    Write-Host "✅ Setup completado. Configura las variables y ejecuta: .\railway-deploy.ps1 -Deploy" -ForegroundColor Green
}

if ($Deploy) {
    Write-Host "🚀 Desplegando a Railway..." -ForegroundColor Yellow
    
    # Verificar que estamos en un proyecto Railway
    try {
        railway status | Out-Null
    } catch {
        Write-Host "❌ No estás en un proyecto Railway. Ejecuta: .\railway-deploy.ps1 -Setup" -ForegroundColor Red
        exit 1
    }
    
    # Deploy
    Write-Host "Iniciando deployment..." -ForegroundColor Blue
    railway up
    
    Write-Host "✅ Deployment iniciado!" -ForegroundColor Green
    Write-Host "Puedes ver el progreso con: .\railway-deploy.ps1 -Logs" -ForegroundColor Cyan
}

if ($Logs) {
    Write-Host "📋 Mostrando logs de Railway..." -ForegroundColor Yellow
    railway logs
}

if ($Status) {
    Write-Host "📊 Estado del proyecto Railway..." -ForegroundColor Yellow
    railway status
    Write-Host ""
    railway ps
}

if (-not $Setup -and -not $Deploy -and -not $Logs -and -not $Status) {
    Write-Host "Uso del script:" -ForegroundColor Yellow
    Write-Host "  .\railway-deploy.ps1 -Setup     # Configurar Railway por primera vez" -ForegroundColor White
    Write-Host "  .\railway-deploy.ps1 -Deploy    # Desplegar aplicación" -ForegroundColor White
    Write-Host "  .\railway-deploy.ps1 -Logs      # Ver logs en tiempo real" -ForegroundColor White
    Write-Host "  .\railway-deploy.ps1 -Status    # Ver estado del deployment" -ForegroundColor White
}
