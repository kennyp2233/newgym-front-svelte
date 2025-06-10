#!/bin/bash

# Railway Deployment Script for Bash
# Este script facilita el deployment a Railway

echo "🚄 Railway Deployment Helper"
echo "================================"

# Verificar si Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI no encontrado. Instalando..."
    echo "Ejecuta: npm install -g @railway/cli"
    exit 1
fi

echo "✅ Railway CLI encontrado"

case "$1" in
    "setup")
        echo "🔧 Configurando proyecto Railway..."
        
        # Login a Railway
        echo "1. Iniciando sesión en Railway..."
        railway login
        
        # Crear o linkar proyecto
        echo "2. Creando/vinculando proyecto..."
        railway link
        
        echo "3. Configurando variables de entorno..."
        echo "Por favor configura estas variables en Railway Dashboard:"
        echo "  - AUTH0_CLIENT_ID"
        echo "  - AUTH0_CLIENT_SECRET"  
        echo "  - AUTH0_DOMAIN"
        echo "  - AUTH_SECRET (genera uno aleatorio)"
        echo "  - NODE_ENV=production"
        
        railway open
        echo "✅ Setup completado. Configura las variables y ejecuta: ./railway-deploy.sh deploy"
        ;;
        
    "deploy")
        echo "🚀 Desplegando a Railway..."
        
        # Verificar que estamos en un proyecto Railway
        if ! railway status &> /dev/null; then
            echo "❌ No estás en un proyecto Railway. Ejecuta: ./railway-deploy.sh setup"
            exit 1
        fi
        
        # Deploy
        echo "Iniciando deployment..."
        railway up
        
        echo "✅ Deployment iniciado!"
        echo "Puedes ver el progreso con: ./railway-deploy.sh logs"
        ;;
        
    "logs")
        echo "📋 Mostrando logs de Railway..."
        railway logs
        ;;
        
    "status")
        echo "📊 Estado del proyecto Railway..."
        railway status
        echo ""
        railway ps
        ;;
        
    *)
        echo "Uso del script:"
        echo "  ./railway-deploy.sh setup     # Configurar Railway por primera vez"
        echo "  ./railway-deploy.sh deploy    # Desplegar aplicación"
        echo "  ./railway-deploy.sh logs      # Ver logs en tiempo real"
        echo "  ./railway-deploy.sh status    # Ver estado del deployment"
        ;;
esac
