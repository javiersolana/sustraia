# Instalación de PostgreSQL para SUSTRAIA

## Opción 1: Instalación Automática (en progreso)

El script `scripts/install-postgres.ps1` está descargando e instalando PostgreSQL automáticamente.

**Espera a que termine** (puede tardar 5-10 minutos según tu conexión).

---

## Opción 2: Instalación Manual (más rápido)

Si prefieres instalarlo manualmente:

### Paso 1: Descargar PostgreSQL 16

Descarga el instalador desde:
**https://www.enterprisedb.com/downloads/postgres-postgresql-downloads**

- Selecciona: **PostgreSQL 16.x** para Windows x86-64

### Paso 2: Instalar PostgreSQL

1. Ejecuta el instalador descargado
2. Durante la instalación configura:
   - **Password del superusuario (postgres)**: `9918`
   - **Puerto**: `5432` (por defecto)
   - **Locale**: Spanish, Spain (o el que prefieras)
3. Marca todas las opciones (Server, pgAdmin, Command Line Tools, Stack Builder)
4. Completa la instalación

### Paso 3: Configurar la Base de Datos

Abre PowerShell **como Administrador** y ejecuta:

```powershell
cd C:\Users\javie\Desktop\sustraia
powershell -ExecutionPolicy Bypass -File scripts\setup-database.ps1
```

Esto creará:
- Usuario `solana` con password `9918`
- Base de datos `sustraia`

### Paso 4: Verificar Instalación

```bash
psql --version
# Debería mostrar: psql (PostgreSQL) 16.x
```

### Paso 5: Ejecutar Migraciones

```bash
npm run db:push
npm run db:seed
```

---

## Opción 3: Uso de Docker (alternativa)

Si prefieres usar Docker:

```bash
docker run --name sustraia-postgres -e POSTGRES_PASSWORD=9918 -e POSTGRES_USER=solana -e POSTGRES_DB=sustraia -p 5432:5432 -d postgres:16
```

Luego ejecuta:
```bash
npm run db:push
npm run db:seed
```

---

## Solución de Problemas

### Error: "Authentication failed"

Verifica que las credenciales en `.env` coincidan:
```env
DATABASE_URL="postgresql://solana:9918@localhost:5432/sustraia?schema=public"
```

### PostgreSQL no inicia

1. Abre "Services" en Windows (Win + R → `services.msc`)
2. Busca "postgresql-x64-16"
3. Click derecho → Start

### Puerto 5432 en uso

Si ya tienes otra instancia de PostgreSQL:
```powershell
# Ver qué usa el puerto 5432
netstat -ano | findstr :5432

# Detener el servicio
net stop postgresql-x64-15  # o el que esté corriendo
```

---

## Verificación Final

Una vez configurado todo, verifica:

```bash
# 1. PostgreSQL está corriendo
psql -U solana -d sustraia -c "SELECT version();"

# 2. Migraciones aplicadas
npm run db:push

# 3. Crear admin
npm run db:seed

# 4. Iniciar servidor
npm run server

# 5. En otra terminal, crear admin
npx tsx scripts/create-admin.ts
```

---

## Contacto

Si tienes problemas, revisa los logs de PostgreSQL en:
`C:\Program Files\PostgreSQL\16\data\log\`
