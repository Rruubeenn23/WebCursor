# 🔐 Configuración de Google OAuth para Fitness Hub

## 📋 Resumen del Error

El error `"Unsupported provider: provider is not enabled"` indica que Google OAuth no está habilitado en tu proyecto de Supabase.

## 🚀 Solución Paso a Paso

### Paso 1: Configurar Google Cloud Console

#### 1.1 Acceder a Google Cloud Console
- Ve a [console.cloud.google.com](https://console.cloud.google.com)
- Inicia sesión con tu cuenta de Google

#### 1.2 Crear/Seleccionar Proyecto
- Crea un nuevo proyecto o selecciona uno existente
- Anota el **Project ID** (lo necesitarás después)

#### 1.3 Habilitar APIs Necesarias
- Ve a **APIs & Services** → **Library**
- Busca y habilita estas APIs:
  - **Google+ API** (o **Google Identity API**)
  - **Google OAuth2 API**

#### 1.4 Crear Credenciales OAuth
- Ve a **APIs & Services** → **Credentials**
- Haz clic en **Create Credentials** → **OAuth 2.0 Client IDs**
- Selecciona **Web application**
- Configura los siguientes campos:

```
Name: Fitness Hub
Authorized JavaScript origins:
- https://web-cursor-five.vercel.app/
- https://web-cursor-five.vercel.app/

Authorized redirect URIs:
- https://web-cursor-five.vercel.app/
- https://web-cursor-five.vercel.app/
```

**⚠️ Importante:** Reemplaza `tu-proyecto` con tu Project ID real de Supabase.

#### 1.5 Obtener Credenciales
- Después de crear, copia:
  - **Client ID**
  - **Client Secret**

### Paso 2: Configurar Supabase

#### 2.1 Acceder al Dashboard
- Ve a [supabase.com](https://supabase.com)
- Inicia sesión y selecciona tu proyecto

#### 2.2 Habilitar Google Provider
- Ve a **Authentication** → **Providers**
- Busca **Google** en la lista
- Activa el toggle para habilitar Google

#### 2.3 Configurar Credenciales
- Haz clic en **Google** para expandir la configuración
- Pega las credenciales de Google:
  - **Client ID**: Tu Google Client ID
  - **Client Secret**: Tu Google Client Secret
- Haz clic en **Save**

### Paso 3: Verificar Configuración

#### 3.1 Probar OAuth
- Ve a tu aplicación: `http://localhost:3000`
- Haz clic en el botón **Google**
- Deberías ser redirigido a Google para autorizar

#### 3.2 Verificar en Supabase
- Ve a **Authentication** → **Users**
- Deberías ver tu usuario creado con Google

## 🔧 Solución de Problemas Comunes

### Error: "Invalid redirect URI"
- Verifica que las URIs en Google Cloud Console coincidan exactamente
- Asegúrate de incluir `https://tu-proyecto.supabase.co/auth/v1/callback`

### Error: "Provider not enabled"
- Verifica que Google esté habilitado en Supabase
- Asegúrate de haber guardado la configuración

### Error: "Invalid client"
- Verifica que el Client ID y Secret sean correctos
- Asegúrate de haber copiado las credenciales completas

## 📝 Variables de Entorno Requeridas

Asegúrate de que tu `.env.local` contenga:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

## 🔗 Enlaces Útiles

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Google Cloud Console](https://console.cloud.google.com)
- [Documentación OAuth de Supabase](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Documentación de Google OAuth](https://developers.google.com/identity/protocols/oauth2)

## ✅ Checklist de Verificación

- [ ] Proyecto creado en Google Cloud Console
- [ ] APIs habilitadas (Google+ API, OAuth2 API)
- [ ] Credenciales OAuth creadas
- [ ] URIs de redirección configuradas
- [ ] Google provider habilitado en Supabase
- [ ] Credenciales pegadas en Supabase
- [ ] Configuración guardada
- [ ] OAuth probado exitosamente

## 🆘 Si Necesitas Ayuda

1. Verifica que todos los pasos se hayan seguido correctamente
2. Revisa los logs de la consola del navegador
3. Verifica las credenciales en Google Cloud Console
4. Comprueba la configuración en Supabase Dashboard
