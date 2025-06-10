# 🚄 Railway Environment Variables Setup Guide

## Variables de Entorno Requeridas

Configura estas variables en tu proyecto Railway (Settings > Environment):

### 🔐 Auth0 Configuration
```
AUTH0_CLIENT_ID=tu_client_id_de_auth0
AUTH0_CLIENT_SECRET=tu_client_secret_de_auth0
AUTH0_DOMAIN=tu-dominio.auth0.com
```

### 🔑 Authentication Secret
```
AUTH_SECRET=un_string_aleatorio_muy_seguro_de_al_menos_32_caracteres
```

### 🌐 Node.js Configuration
```
NODE_ENV=production
PORT=3000
```

### 📝 Opcional: API Configuration
```
API_BASE_URL=https://tu-api-backend.railway.app
DATABASE_URL=postgresql://user:password@host:port/database
```

## 🔧 Cómo Configurar

### Opción 1: Railway Dashboard
1. Ve a tu proyecto en [Railway.app](https://railway.app)
2. Ve a Settings > Environment
3. Agrega cada variable una por una

### Opción 2: Railway CLI
```bash
# Establecer variables individualmente
railway variables set AUTH0_CLIENT_ID=tu_valor
railway variables set AUTH0_CLIENT_SECRET=tu_valor
railway variables set AUTH0_DOMAIN=tu_valor
railway variables set AUTH_SECRET=tu_valor

# Ver todas las variables
railway variables
```

### Opción 3: Archivo .env (Solo para desarrollo local)
```bash
# Copia .env.example a .env y llena los valores
cp .env.example .env
# Edita .env con tus valores reales
```

## 🔐 Generar AUTH_SECRET

Puedes generar un AUTH_SECRET seguro con:

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# PowerShell
[System.Web.Security.Membership]::GeneratePassword(32, 4)

# Online (usa con cuidado)
# https://generate-secret.vercel.app/32
```

## ✅ Verificación

Una vez configuradas las variables, tu aplicación debería:
- ✅ Hacer build sin errores
- ✅ Iniciar correctamente en Railway
- ✅ Permitir autenticación Auth0
- ✅ Responder en el health check endpoint "/"

## 🆘 Troubleshooting

### Error: Variables no encontradas
- Verifica que las variables estén configuradas en Railway
- Redeploy después de agregar variables
- Verifica los nombres exactos (case-sensitive)

### Error de Auth0
- Verifica que AUTH0_DOMAIN no incluya "https://"
- Asegúrate que los callbacks URLs estén configurados en Auth0
- Agrega la URL de Railway a los Allowed Origins en Auth0
