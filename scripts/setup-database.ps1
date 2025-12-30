# Setup PostgreSQL database for SUSTRAIA
# Run after PostgreSQL installation

Write-Host "Setting up SUSTRAIA database..." -ForegroundColor Cyan

# PostgreSQL credentials from .env
$PGPASSWORD = "9918"
$PGUSER = "postgres"
$PGHOST = "localhost"
$PGPORT = "5432"

# Set environment variable for password
$env:PGPASSWORD = $PGPASSWORD

Write-Host "Creating database user 'solana'..." -ForegroundColor Yellow
$createUserSQL = "CREATE USER solana WITH PASSWORD '9918'; ALTER USER solana CREATEDB;"

try {
    & "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U $PGUSER -h $PGHOST -p $PGPORT -d postgres -c $createUserSQL 2>&1 | Out-Null
    Write-Host "User 'solana' created" -ForegroundColor Green
} catch {
    Write-Host "Note: User 'solana' may already exist" -ForegroundColor Yellow
}

Write-Host "Creating database 'sustraia'..." -ForegroundColor Yellow
$createDBSQL = "CREATE DATABASE sustraia OWNER solana;"

try {
    & "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U $PGUSER -h $PGHOST -p $PGPORT -d postgres -c $createDBSQL 2>&1 | Out-Null
    Write-Host "Database 'sustraia' created" -ForegroundColor Green
} catch {
    Write-Host "Note: Database 'sustraia' may already exist" -ForegroundColor Yellow
}

Write-Host "`nDatabase setup complete!" -ForegroundColor Green
Write-Host "You can now run:" -ForegroundColor Cyan
Write-Host "  npm run db:push" -ForegroundColor White
Write-Host "  npm run db:seed" -ForegroundColor White
