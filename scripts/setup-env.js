#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
const examplePath = path.join(process.cwd(), '.env.example');

// Contenido del archivo .env.local con valores temporales para desarrollo
const envContent = `# Supabase Configuration
# Obtén estas claves desde: https://supabase.com/dashboard/project/[tu-proyecto]/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder_anon_key
SUPABASE_SERVICE_ROLE_KEY=placeholder_service_role_key

# Next.js Configuration
NEXTAUTH_SECRET=placeholder_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# n8n Configuration (for automation workflows)
BASE_URL=http://localhost:3000
API_TOKEN=placeholder_api_token
DEFAULT_TEMPLATE_ID=placeholder_template_id

# Telegram Bot Configuration (optional)
TELEGRAM_BOT_TOKEN=placeholder_telegram_bot_token
TELEGRAM_CHAT_ID=placeholder_telegram_chat_id

# Database Configuration
DATABASE_URL=placeholder_database_url

# NOTA: Estos son valores temporales para desarrollo
# Reemplaza con tus claves reales de Supabase para producción
`;

function setupEnv() {
  try {
    // Verificar si ya existe .env.local
    if (fs.existsSync(envPath)) {
      console.log('✅ Archivo .env.local ya existe');
      return;
    }

    // Crear .env.local
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Archivo .env.local creado con valores temporales');
    console.log('⚠️  Recuerda configurar tus claves reales de Supabase antes de usar la aplicación');
    
  } catch (error) {
    console.error('❌ Error creando .env.local:', error.message);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupEnv();
}

module.exports = setupEnv;
