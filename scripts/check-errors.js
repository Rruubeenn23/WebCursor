#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function checkErrors() {
  console.log('🔍 Verificando errores en el proyecto...\n');

  try {
    // Verificar TypeScript
    console.log('📝 Verificando TypeScript...');
    execSync('npx tsc --noEmit', { stdio: 'inherit' });
    console.log('✅ TypeScript sin errores\n');
  } catch (error) {
    console.log('❌ Errores de TypeScript encontrados\n');
  }

  try {
    // Verificar ESLint
    console.log('🔍 Verificando ESLint...');
    execSync('npm run lint', { stdio: 'inherit' });
    console.log('✅ ESLint sin errores\n');
  } catch (error) {
    console.log('❌ Errores de ESLint encontrados\n');
  }

  // Verificar archivos críticos
  console.log('📁 Verificando archivos críticos...');
  
  const criticalFiles = [
    'lib/utils.ts',
    'app/(app)/plan/page.tsx',
    'app/(app)/comidas/page.tsx',
    'app/(app)/entrenos/page.tsx',
    'app/(app)/ajustes/page.tsx',
    'components/providers/supabase-provider.tsx'
  ];

  criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} existe`);
    } else {
      console.log(`❌ ${file} NO existe`);
    }
  });

  console.log('\n🔧 Verificando imports...');
  
  // Verificar imports comunes
  const filesToCheck = [
    'app/(app)/plan/page.tsx',
    'app/(app)/comidas/page.tsx',
    'app/(app)/entrenos/page.tsx',
    'app/(app)/ajustes/page.tsx'
  ];

  filesToCheck.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Verificar imports de utils
      if (content.includes('formatDate') && !content.includes('from \'@/lib/utils\'')) {
        console.log(`⚠️  ${file}: formatDate importado pero no desde @/lib/utils`);
      }
      
      // Verificar imports de Supabase
      if (content.includes('useSupabase') && !content.includes('from \'@/components/providers/supabase-provider\'')) {
        console.log(`⚠️  ${file}: useSupabase importado incorrectamente`);
      }
    }
  });

  console.log('\n✅ Verificación completada');
}

if (require.main === module) {
  checkErrors();
}

module.exports = checkErrors;
