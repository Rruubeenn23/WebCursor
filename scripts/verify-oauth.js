#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function verifyOAuthConfig() {
  console.log('🔍 Verificando configuración de OAuth...\n');

  // Verificar variables de entorno
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.log('❌ Archivo .env.local no encontrado');
    console.log('💡 Ejecuta: node scripts/setup-env.js');
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Verificar variables de Supabase
  const hasSupabaseUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL');
  const hasSupabaseAnonKey = envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  if (!hasSupabaseUrl || !hasSupabaseAnonKey) {
    console.log('❌ Variables de Supabase no configuradas');
    console.log('💡 Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY');
    return;
  }

  console.log('✅ Variables de entorno configuradas');

  // Verificar que no sean valores placeholder
  if (envContent.includes('placeholder') || envContent.includes('your_')) {
    console.log('⚠️  Usando valores temporales');
    console.log('💡 Reemplaza con tus claves reales de Supabase');
  } else {
    console.log('✅ Usando claves reales de Supabase');
  }

  console.log('\n📋 Pasos para habilitar Google OAuth:');
  console.log('1. Ve a https://console.cloud.google.com');
  console.log('2. Crea credenciales OAuth 2.0');
  console.log('3. Configura redirect URIs:');
  console.log('   - https://tu-proyecto.supabase.co/auth/v1/callback');
  console.log('   - http://localhost:3000/auth/callback');
  console.log('4. Ve a Supabase → Authentication → Providers');
  console.log('5. Habilita Google y pega las credenciales');
  console.log('6. Guarda la configuración');

  console.log('\n🔗 Enlaces útiles:');
  console.log('- Supabase Dashboard: https://supabase.com/dashboard');
  console.log('- Google Cloud Console: https://console.cloud.google.com');
  console.log('- Documentación OAuth: https://supabase.com/docs/guides/auth/social-login/auth-google');
}

if (require.main === module) {
  verifyOAuthConfig();
}

module.exports = verifyOAuthConfig;
