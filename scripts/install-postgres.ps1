# Install PostgreSQL 16 on Windows
# Run: powershell -ExecutionPolicy Bypass -File scripts\install-postgres.ps1

Write-Host "Installing PostgreSQL 16..." -ForegroundColor Cyan

# PostgreSQL 16 installer URL
$url = "https://get.enterprisedb.com/postgresql/postgresql-16.6-1-windows-x64.exe"
$installer = "$env:TEMP\postgresql-16-installer.exe"

Write-Host "Downloading PostgreSQL..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $url -OutFile $installer -UseBasicParsing
    Write-Host "Download complete" -ForegroundColor Green
} catch {
    Write-Host "Download failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host "Installing PostgreSQL (this may take a few minutes)..." -ForegroundColor Yellow

# Install silently with password from .env
$args = @(
    "--mode", "unattended",
    "--superpassword", "9918",
    "--serverport", "5432",
    "--servicename", "postgresql-x64-16",
    "--prefix", "C:\Program Files\PostgreSQL\16",
    "--datadir", "C:\Program Files\PostgreSQL\16\data"
)

try {
    Start-Process -FilePath $installer -ArgumentList $args -Wait -NoNewWindow
    Write-Host "PostgreSQL installed successfully" -ForegroundColor Green
} catch {
    Write-Host "Installation failed: $_" -ForegroundColor Red
    Write-Host "Try manual install: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}

# Add to PATH
$pgPath = "C:\Program Files\PostgreSQL\16\bin"
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$pgPath*") {
    [Environment]::SetEnvironmentVariable("Path", "$userPath;$pgPath", "User")
    Write-Host "PostgreSQL added to PATH" -ForegroundColor Green
}

Write-Host "`nInstallation complete!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Close and reopen terminal" -ForegroundColor White
Write-Host "  2. Run: psql --version" -ForegroundColor White
Write-Host "  3. Run: npm run db:push" -ForegroundColor White
Write-Host "  4. Run: npm run db:seed" -ForegroundColor White

Write-Host "`nPostgreSQL credentials:" -ForegroundColor Cyan
Write-Host "  User: postgres" -ForegroundColor White
Write-Host "  Password: 9918" -ForegroundColor White
Write-Host "  Port: 5432" -ForegroundColor White

# Cleanup
Remove-Item $installer -Force -ErrorAction SilentlyContinue
