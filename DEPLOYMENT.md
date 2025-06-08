# 🚀 Deployment Guide - Gym Frontend

## 📋 Resumen de Cambios

Este proyecto ha sido configurado para un deployment de producción adecuado, reemplazando `vite preview` con un servidor Node.js robusto usando `@sveltejs/adapter-node`.

### ✅ Mejoras Implementadas

1. **Adaptador Node.js**: Configurado `@sveltejs/adapter-node` para generar un servidor Node.js standalone
2. **Dockerfile Multi-stage**: Build optimizado para producción
3. **Scripts de Deployment**: Scripts automatizados para Windows y Linux
4. **Configuración de Seguridad**: Usuario no-root, health checks, y signal handling
5. **Optimización de Tamaño**: Eliminación de dev dependencies en producción

## 🚄 Railway Deployment (Recomendado)

Railway es la plataforma más fácil para deployar tu aplicación SvelteKit. Ya tienes todo configurado:

### Pre-requisitos
1. Cuenta en [Railway.app](https://railway.app)
2. Variables de entorno configuradas

### Pasos para Deploy

1. **Conecta tu repositorio:**
   ```bash
   # En tu repositorio, conecta con Railway
   railway login
   railway link
   ```

2. **Configura las variables de entorno en Railway:**
   - `AUTH0_CLIENT_ID`: Tu Client ID de Auth0
   - `AUTH0_CLIENT_SECRET`: Tu Client Secret de Auth0  
   - `AUTH0_DOMAIN`: Tu dominio de Auth0 (sin https://)
   - `AUTH_SECRET`: Un string aleatorio seguro para JWT
   - `NODE_ENV`: production
   - `PORT`: 3000

3. **Deploy automático:**
   ```bash
   railway up
   ```

### ✅ Ventajas de Railway
- ✅ **Auto-deploy** desde Git push
- ✅ **HTTPS automático** con certificados SSL
- ✅ **Variables de entorno seguras**
- ✅ **Logs en tiempo real**
- ✅ **Escalado automático**
- ✅ **PostgreSQL incluido** (si necesitas base de datos)

### Configuración Railway
Tu `railway.json` ya está configurado:
```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "node build",
    "healthcheckPath": "/",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

## 🐳 Docker Setup (Alternativo)

### Construcción Local

```bash
# Construir la imagen
docker build -t gym-frontend:latest .

# Ejecutar localmente
docker run -p 3000:3000 gym-frontend:latest
```

### Usando Scripts Automatizados

**Windows (PowerShell):**
```powershell
# Solo construir
.\build-and-deploy.ps1

# Construir y ejecutar localmente
.\build-and-deploy.ps1 -RunLocal

# Construir con tag específico
.\build-and-deploy.ps1 -Tag "v1.0.0" -RunLocal
```

**Linux/Mac:**
```bash
# Dar permisos de ejecución
chmod +x build-and-deploy.sh

# Ejecutar script
./build-and-deploy.sh
```

### Docker Compose

Para desarrollo y testing local:

```bash
docker-compose up -d
```

## 🏗️ Proceso de Build

### Desarrollo
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Construir para producción
npm run start        # Ejecutar build de producción
```

### Producción
```bash
npm ci               # Instalar dependencias (production-ready)
npm run build        # Construir aplicación
npm run start        # Iniciar servidor Node.js
```

## 🚀 Deployment Options

### 1. Railway
- El archivo `railway.json` está configurado
- Railway detectará automáticamente el Dockerfile
- Variables de entorno se configuran en el dashboard

### 2. Docker Registry (AWS ECR, Docker Hub, etc.)
```bash
# Tag para registry
docker tag gym-frontend:latest your-registry/gym-frontend:latest

# Push al registry
docker push your-registry/gym-frontend:latest
```

### 3. Cloud Platforms
- **AWS ECS/Fargate**: Usar la imagen Docker
- **Google Cloud Run**: Deploy directo desde Dockerfile
- **Azure Container Instances**: Deploy con imagen Docker

## 🔧 Variables de Entorno

Las siguientes variables están configuradas por defecto:

```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
```

Puedes sobrescribir estas variables según tu entorno:

```bash
# Ejemplo con puerto personalizado
docker run -p 8080:8080 -e PORT=8080 gym-frontend:latest
```

## 🏥 Health Checks

El container incluye health checks automáticos:
- **Endpoint**: `http://localhost:3000/`
- **Intervalo**: 30 segundos
- **Timeout**: 3 segundos
- **Reintentos**: 3

## 🔐 Seguridad

### Configuraciones de Seguridad Implementadas

1. **Usuario No-Root**: El container ejecuta como usuario `sveltekit` (UID 1001)
2. **Signal Handling**: Uso de `dumb-init` para manejo apropiado de señales
3. **Minimal Base Image**: Uso de `node:20-alpine` para reducir superficie de ataque
4. **Dependencies Pruning**: Eliminación de dev dependencies en producción

### Recomendaciones Adicionales

1. **Reverse Proxy**: Considera usar nginx o traefik como reverse proxy
2. **HTTPS**: Configura SSL/TLS en tu reverse proxy
3. **Rate Limiting**: Implementa rate limiting en tu proxy
4. **Monitoring**: Añade logging y monitoring (Prometheus, Grafana)

## 📊 Monitoring

### Logs
```bash
# Ver logs del container
docker logs gym-frontend-test -f

# En production con docker-compose
docker-compose logs -f gym-frontend
```

### Performance
El servidor Node.js es más eficiente que `vite preview`:
- ✅ Mejor manejo de concurrent connections
- ✅ Optimizado para producción
- ✅ Menor uso de memoria
- ✅ Arranque más rápido

## 🛠️ Troubleshooting

### Problemas Comunes

1. **Puerto ocupado**: Cambiar mapeo de puertos `-p 3001:3000`
2. **Permisos**: Verificar que Docker tiene permisos adecuados
3. **Build failures**: Revisar `.dockerignore` y dependencies

### Debug Mode
```bash
# Ejecutar container en modo interactivo
docker run -it --rm gym-frontend:latest sh

# Ver archivos construidos
docker run --rm gym-frontend:latest ls -la build/
```

## 📝 Próximos Pasos

1. **Test en staging**: Despliega en un ambiente de staging primero
2. **CI/CD**: Configura pipeline automatizado (GitHub Actions, GitLab CI)
3. **Monitoring**: Implementa APM (Application Performance Monitoring)
4. **Backup**: Configura backup de datos si es necesario
5. **CDN**: Considera usar CDN para assets estáticos

---

**¡Tu aplicación ahora está lista para producción! 🎉**

El cambio de `vite preview` a un servidor Node.js dedicado mejorará significativamente la estabilidad y performance en producción.
