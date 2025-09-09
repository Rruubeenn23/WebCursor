#!/bin/bash

# Fitness & Nutrition Hub Setup Script
# Este script automatiza la configuración inicial del proyecto

set -e

echo "🚀 Configurando Fitness & Nutrition Hub..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar Node.js
print_status "Verificando Node.js..."
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado. Por favor instala Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js versión 18+ es requerida. Versión actual: $(node -v)"
    exit 1
fi

print_success "Node.js $(node -v) detectado"

# Verificar npm
print_status "Verificando npm..."
if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado"
    exit 1
fi

print_success "npm $(npm -v) detectado"

# Instalar dependencias
print_status "Instalando dependencias..."
npm install

if [ $? -eq 0 ]; then
    print_success "Dependencias instaladas correctamente"
else
    print_error "Error instalando dependencias"
    exit 1
fi

# Crear archivo .env.local si no existe
if [ ! -f .env.local ]; then
    print_status "Creando archivo .env.local..."
    cp env.example .env.local
    print_success "Archivo .env.local creado"
    print_warning "Por favor edita .env.local con tus credenciales de Supabase"
else
    print_warning "Archivo .env.local ya existe"
fi

# Verificar si las variables de entorno están configuradas
print_status "Verificando configuración de variables de entorno..."

if grep -q "your_supabase_project_url" .env.local; then
    print_warning "Variables de entorno no configuradas"
    echo ""
    echo "Por favor configura las siguientes variables en .env.local:"
    echo "1. NEXT_PUBLIC_SUPABASE_URL"
    echo "2. NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "3. SUPABASE_SERVICE_ROLE_KEY"
    echo ""
    echo "Puedes obtener estas claves desde:"
    echo "https://supabase.com/dashboard/project/[tu-proyecto]/settings/api"
    echo ""
else
    print_success "Variables de entorno configuradas"
fi

# Crear directorio para logs si no existe
mkdir -p logs

# Verificar si el esquema de base de datos está listo
print_status "Verificando esquema de base de datos..."
if [ -f "database/schema.sql" ]; then
    print_success "Esquema de base de datos encontrado"
    print_warning "Recuerda ejecutar el esquema SQL en Supabase:"
    echo "1. Ve a tu proyecto de Supabase"
    echo "2. Abre el SQL Editor"
    echo "3. Ejecuta: database/schema.sql"
    echo "4. Ejecuta: database/seed.sql (opcional)"
    echo ""
else
    print_error "Esquema de base de datos no encontrado"
fi

# Verificar workflows de n8n
print_status "Verificando workflows de n8n..."
if [ -d "n8n-workflows" ]; then
    print_success "Workflows de n8n encontrados"
    print_warning "Para configurar automatizaciones:"
    echo "1. Instala n8n: docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n"
    echo "2. Importa los workflows de n8n-workflows/"
    echo "3. Configura las variables de entorno en n8n"
    echo ""
else
    print_error "Workflows de n8n no encontrados"
fi

# Ejecutar build para verificar que todo funciona
print_status "Verificando build del proyecto..."
npm run build

if [ $? -eq 0 ]; then
    print_success "Build exitoso"
else
    print_error "Error en el build"
    print_warning "Verifica la configuración y las variables de entorno"
    exit 1
fi

# Mostrar información final
echo ""
echo "🎉 ¡Configuración completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Configura las variables de entorno en .env.local"
echo "2. Ejecuta el esquema SQL en Supabase"
echo "3. Ejecuta: npm run dev"
echo "4. Abre: http://https://web-cursor-five.vercel.app/"
echo ""
echo "📚 Documentación:"
echo "- README.md para instrucciones detalladas"
echo "- Supabase Dashboard para gestión de base de datos"
echo "- n8n para automatizaciones (opcional)"
echo ""
echo "🆘 Si tienes problemas:"
echo "- Verifica el README.md"
echo "- Revisa los logs en la consola"
echo "- Asegúrate de que Supabase esté configurado correctamente"
echo ""

print_success "¡Fitness & Nutrition Hub está listo para usar!"
