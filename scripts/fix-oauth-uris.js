#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function fixOAuthURIs() {
  console.log('🔧 Verificando y corrigiendo URIs de OAuth...\n');

  // Leer .env.local
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.log('❌ Archivo .env.local no encontrado');
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Extraer URL de Supabase
  const supabaseUrlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(https:\/\/[^.]+\.supabase\.co)/);
  
  if (!supabaseUrlMatch) {
    console.log('❌ No se pudo encontrar la URL de Supabase');
    return;
  }

  const supabaseUrl = supabaseUrlMatch[1];
  const projectId = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
  
  console.log('✅ URL de Supabase encontrada:', supabaseUrl);
  console.log('✅ Project ID:', projectId);

  console.log('\n📋 URIs que debes configurar en Google Cloud Console:');
  console.log('\n🔗 Authorized redirect URIs:');
  console.log(`   ${supabaseUrl}/auth/v1/callback`);
  console.log('   http://localhost:3000/auth/callback');
  
  console.log('\n🌐 Authorized JavaScript origins:');
  console.log('   http://localhost:3000');
  console.log(`   ${supabaseUrl}`);

  console.log('\n📝 Pasos para configurar:');
  console.log('1. Ve a https://console.cloud.google.com');
  console.log('2. Selecciona tu proyecto');
  console.log('3. Ve a APIs & Services → Credentials');
  console.log('4. Encuentra tu OAuth 2.0 Client ID y haz clic');
  console.log('5. En "Authorized redirect URIs" agrega las URLs de arriba');
  console.log('6. En "Authorized JavaScript origins" agrega las URLs de arriba');
  console.log('7. Haz clic en Save');
  console.log('8. Espera 2-3 minutos para que se propaguen los cambios');

  console.log('\n⚠️  IMPORTANTE:');
  console.log('- Usa exactamente las URLs mostradas arriba');
  console.log('- No olvides el protocolo https://');
  console.log('- No olvides la ruta /auth/v1/callback');
  console.log('- Los cambios pueden tardar unos minutos en propagarse');

  console.log('\n🔗 Enlaces directos:');
  console.log('- Google Cloud Console: https://console.cloud.google.com');
  console.log('- Supabase Dashboard: https://supabase.com/dashboard');
}

if (require.main === module) {
  fixOAuthURIs();
}

module.exports = fixOAuthURIs;
