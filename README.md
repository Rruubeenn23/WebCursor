# Fitness & Nutrition Hub

Tu hub personal para entrenamiento, nutrición y automatizaciones. Una aplicación completa construida con Next.js 14, Supabase y n8n para gestionar tu fitness y nutrición de manera inteligente.

## 🚀 Características

### ✅ Funcionalidades Principales
- **Autenticación**: Email/contraseña y Google OAuth
- **Dashboard "Hoy"**: Vista del día actual con progreso de macros y comidas planificadas
- **Plan Semanal**: Vista de 7 días con distinción entre días de entrenamiento y descanso
- **Gestión de Comidas**: CRUD de plantillas y alimentos
- **Gestión de Entrenos**: CRUD de rutinas y ejercicios con tipos (Gimnasio/Boxeo)
- **Chatbot de Nutrición**: Análisis de macros mediante IA para comidas no predefinidas
- **Seguimiento de Macros**: Cálculo automático de calorías, proteínas, carbohidratos y grasas
- **Ajustes Personalizados**: Metas nutricionales y configuración de zona horaria

### 🤖 Automatizaciones (n8n)
- **Generación Semanal**: Crea automáticamente el plan de la semana cada domingo a las 20:00
- **Recordatorios de Comidas**: Notificaciones cada 15 minutos para comidas próximas
- **Análisis de Macros**: Chatbot inteligente para analizar comidas y extraer macros
- **Integración Telegram**: Notificaciones y botones interactivos

### 📱 Diseño Responsivo
- Mobile-first design con Tailwind CSS
- Navegación optimizada para móvil
- Tablas responsive con overflow horizontal

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **Base de Datos**: Supabase PostgreSQL con RLS
- **Autenticación**: Supabase Auth
- **Validación**: Zod
- **Fechas**: date-fns con zona horaria Europe/Madrid
- **Automatizaciones**: n8n (self-hosted o cloud)
- **Notificaciones**: Telegram Bot API

## 📋 Requisitos Previos

- Node.js 18+ 
- npm (no yarn)
- Cuenta de Supabase
- Cuenta de n8n (opcional para automatizaciones)
- Bot de Telegram (opcional para notificaciones)

## 🚀 Instalación y Configuración

### 1. Clonar y Instalar Dependencias

```bash
# Clonar el repositorio
git clone <repository-url>
cd fitness-nutrition-hub

# Instalar dependencias
npm install
```

### 2. Configurar Supabase

1. **Crear proyecto en Supabase**:
   - Ve a [supabase.com](https://supabase.com)
   - Crea un nuevo proyecto
   - Guarda la URL y las claves

2. **Configurar autenticación**:
   - En Authentication > Settings > Auth Providers
   - Habilita Email y Google OAuth
   - Para Google OAuth, configura las credenciales en Google Cloud Console

3. **Importar esquema de base de datos**:
   ```bash
   # En el SQL Editor de Supabase, ejecuta:
   # 1. database/schema.sql (esquema completo)
   # 2. database/seed.sql (datos de ejemplo)
   ```

### 3. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp env.example .env.local

# Editar .env.local con tus valores
```

**Variables requeridas**:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role

# Next.js
NEXTAUTH_SECRET=tu_secret_aleatorio
NEXTAUTH_URL=http://localhost:3000
```

**Variables opcionales** (para automatizaciones):
```env
# n8n
BASE_URL=http://localhost:3000
API_TOKEN=token_para_n8n
DEFAULT_TEMPLATE_ID=id_de_plantilla_por_defecto

# Telegram
TELEGRAM_BOT_TOKEN=token_del_bot
TELEGRAM_CHAT_ID=tu_chat_id
```

### 4. Ejecutar en Desarrollo

```bash
# Ejecutar en modo desarrollo
npm run dev

# Abrir http://localhost:3000
```

### 5. Configurar n8n (Opcional)

1. **Instalar n8n**:
   ```bash
   # Con Docker
   docker run -it --rm \
     --name n8n \
     -p 5678:5678 \
     -v ~/.n8n:/home/node/.n8n \
     n8nio/n8n
   ```

2. **Importar workflows**:
   - Abre n8n en http://localhost:5678
   - Importa los archivos de `n8n-workflows/`
   - Configura las variables de entorno en n8n

3. **Configurar variables en n8n**:
   - `BASE_URL`: URL de tu aplicación
   - `API_TOKEN`: Token para autenticación
   - `TELEGRAM_BOT_TOKEN`: Token del bot de Telegram
   - `TELEGRAM_CHAT_ID`: Tu chat ID de Telegram

## 📊 Estructura del Proyecto

```
fitness-nutrition-hub/
├── app/                          # Next.js App Router
│   ├── (app)/                    # Rutas protegidas
│   │   ├── today/               # Dashboard "Hoy"
│   │   ├── plan/                # Plan semanal
│   │   ├── comidas/             # Gestión de comidas
│   │   ├── entrenos/            # Gestión de entrenos
│   │   └── ajustes/             # Configuración
│   ├── api/                     # API Routes
│   │   ├── health/              # Health check
│   │   ├── plans/               # Gestión de planes
│   │   └── hooks/               # Webhooks
│   └── layout.tsx               # Layout principal
├── components/                   # Componentes React
│   ├── ui/                      # Componentes de UI
│   ├── layout/                  # Layout components
│   ├── nutrition/               # Componentes de nutrición
│   └── providers/               # Providers de contexto
├── lib/                         # Utilidades y configuraciones
│   ├── supabase.ts             # Cliente de Supabase
│   ├── utils.ts                # Funciones utilitarias
│   └── validations.ts          # Esquemas de validación
├── database/                    # Esquemas de base de datos
│   ├── schema.sql              # Esquema completo
│   └── seed.sql                # Datos de ejemplo
├── n8n-workflows/              # Workflows de automatización
│   ├── generate-week.json      # Generación semanal
│   └── meal-reminders.json     # Recordatorios de comidas
└── types/                      # Tipos de TypeScript
    └── supabase.ts             # Tipos de Supabase
```

## 🗄️ Esquema de Base de Datos

### Tablas Principales

- **users**: Perfiles de usuario
- **goals**: Metas nutricionales por usuario
- **foods**: Base de datos de alimentos
- **meal_templates**: Plantillas de comidas
- **day_plans**: Planes diarios
- **day_plan_items**: Items de comidas del día
- **workouts**: Rutinas de entrenamiento
- **exercises**: Ejercicios disponibles
- **schedule**: Programación de entrenos
- **logs_meals**: Registro de comidas consumidas

### Seguridad (RLS)

Todas las tablas tienen Row Level Security (RLS) habilitado:
- Los usuarios solo pueden acceder a sus propios datos
- Las tablas `foods` y `exercises` son de solo lectura para usuarios autenticados
- Políticas automáticas basadas en `auth.uid()`

## 🔧 API Endpoints

### Autenticación
- `POST /api/auth/signup` - Registro de usuario
- `POST /api/auth/signin` - Inicio de sesión

### Planes
- `GET /api/plans/today` - Obtener plan del día actual
- `POST /api/plans/create` - Crear plan del día
- `PUT /api/plans/:id` - Actualizar plan

### Comidas
- `POST /api/hooks/meal-done` - Marcar comida como hecha
- `GET /api/meals/templates` - Obtener plantillas
- `POST /api/meals/templates` - Crear plantilla

### Chatbot
- `POST /api/chatbot/analyze` - Análisis de macros de comidas

### Health Check
- `GET /api/health` - Estado de la aplicación

## 🤖 Automatizaciones con n8n

### Workflow 1: Generación Semanal
- **Trigger**: Cada domingo a las 20:00
- **Acción**: Crea planes para toda la semana
- **Notificación**: Resumen por Telegram

### Workflow 2: Recordatorios de Comidas
- **Trigger**: Cada 15 minutos
- **Acción**: Verifica comidas próximas
- **Notificación**: Recordatorio con botón "Marcar hecho"

### Workflow 3: Análisis de Macros (Chatbot)
- **Trigger**: Webhook desde la aplicación
- **Acción**: Analiza descripción de comida y extrae macros
- **Respuesta**: Devuelve macros calculados y sugiere guardar alimento

## 📱 Uso de la Aplicación

### 1. Registro e Inicio de Sesión
- Registra una cuenta con email o usa Google OAuth
- Configura tus metas nutricionales en Ajustes

### 2. Configurar Metas
- Ve a Ajustes > Metas Nutricionales
- Establece tus objetivos de calorías y macros
- Configura tu zona horaria

### 3. Crear Plantillas de Comidas
- Ve a Comidas > Plantillas
- Crea plantillas reutilizables con alimentos y cantidades

### 4. Planificar la Semana
- Ve a Plan para ver la semana completa
- Marca días de entrenamiento vs descanso
- Aplica plantillas a días específicos

### 5. Análisis de Comidas con Chatbot
- Ve a Chatbot para analizar comidas no predefinidas
- Describe tu comida (ej: "Comí una manzana de 150g")
- Guarda nuevos alimentos en la base de datos

### 6. Seguimiento Diario
- Ve a Hoy para ver el progreso del día
- Marca comidas como hechas
- Visualiza macros restantes

## 🚀 Despliegue

### Vercel (Recomendado)

1. **Conectar repositorio**:
   ```bash
   # Instalar Vercel CLI
   npm i -g vercel

   # Desplegar
   vercel
   ```

2. **Configurar variables de entorno** en Vercel Dashboard

3. **Configurar dominio personalizado** (opcional)

### Variables de Entorno en Producción

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role
NEXTAUTH_SECRET=secret_aleatorio_largo
NEXTAUTH_URL=https://tu-dominio.com
```

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests en modo watch
npm run test:watch
```

## 📈 Monitoreo y Logs

### Supabase
- Dashboard de Supabase para monitorear base de datos
- Logs de autenticación y consultas

### Vercel
- Analytics y métricas de rendimiento
- Logs de funciones serverless

### n8n
- Dashboard de n8n para monitorear workflows
- Logs de ejecución de automatizaciones

## 🔒 Seguridad

### Implementado
- ✅ Row Level Security (RLS) en Supabase
- ✅ Autenticación con Supabase Auth
- ✅ Validación con Zod en todos los endpoints
- ✅ CORS configurado
- ✅ Variables de entorno seguras

### Recomendaciones
- 🔄 Rotar claves de API regularmente
- 🔄 Monitorear logs de autenticación
- 🔄 Usar HTTPS en producción
- 🔄 Implementar rate limiting

## 🐛 Troubleshooting

### Problemas Comunes

1. **Error de autenticación**:
   - Verifica las claves de Supabase
   - Confirma que el dominio esté en la lista blanca

2. **Error de base de datos**:
   - Ejecuta el esquema SQL completo
   - Verifica las políticas RLS

3. **n8n no funciona**:
   - Verifica las variables de entorno
   - Confirma que la API esté accesible

4. **Telegram no envía mensajes**:
   - Verifica el token del bot
   - Confirma el chat ID

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

- **Issues**: Usa GitHub Issues para reportar bugs
- **Discussions**: Usa GitHub Discussions para preguntas
- **Documentación**: Consulta este README y los comentarios en el código

## 🎯 Roadmap

### Próximas Funcionalidades
- [ ] App móvil con React Native
- [ ] Integración con wearables (Apple Watch, Fitbit)
- [ ] IA para sugerencias de comidas
- [ ] Análisis avanzado de progreso
- [ ] Integración con MyFitnessPal
- [ ] Modo offline
- [ ] Exportación de datos
- [ ] Múltiples idiomas

### Mejoras Técnicas
- [ ] PWA (Progressive Web App)
- [ ] Cache inteligente
- [ ] Optimización de imágenes
- [ ] Tests E2E con Playwright
- [ ] CI/CD mejorado

---

**¡Disfruta tu Fitness & Nutrition Hub! 💪🥗**
