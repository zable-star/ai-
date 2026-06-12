# PowerShell script for database setup on Windows

$ErrorActionPreference = "Stop"

Write-Host "Voice Drawing Backend - Database Setup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Check if psql is available
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "Error: PostgreSQL is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install PostgreSQL from: https://www.postgresql.org/download/windows/"
    exit 1
}

# Load environment variables from .env
if (Test-Path ".env") {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
    Write-Host "Loaded configuration from .env" -ForegroundColor Yellow
} else {
    Write-Host "Warning: .env file not found, using defaults" -ForegroundColor Yellow
}

$DB_HOST = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$DB_PORT = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }
$DB_NAME = if ($env:DB_NAME) { $env:DB_NAME } else { "voice_drawing" }
$DB_USER = if ($env:DB_USER) { $env:DB_USER } else { "postgres" }

Write-Host "Database Configuration:" -ForegroundColor Cyan
Write-Host "  Host: $DB_HOST"
Write-Host "  Port: $DB_PORT"
Write-Host "  Database: $DB_NAME"
Write-Host "  User: $DB_USER"
Write-Host ""

# Set PGPASSWORD environment variable
if ($env:DB_PASSWORD) {
    $env:PGPASSWORD = $env:DB_PASSWORD
} else {
    $securePassword = Read-Host "Enter PostgreSQL password for user '$DB_USER'" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $env:PGPASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

# Check if database exists
Write-Host "Checking if database exists..." -ForegroundColor Yellow
$dbExists = & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | Select-String -Pattern "\b$DB_NAME\b"

if (-not $dbExists) {
    Write-Host "Database does not exist. Creating..." -ForegroundColor Yellow
    & createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Database created" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to create database" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✓ Database already exists" -ForegroundColor Green
}

# Run schema
Write-Host ""
Write-Host "Running database schema..." -ForegroundColor Yellow
& psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f db\schema.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Schema applied successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to apply schema" -ForegroundColor Red
    exit 1
}

# Verify tables
Write-Host ""
Write-Host "Verifying tables..." -ForegroundColor Yellow
& psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\dt"

Write-Host ""
Write-Host "Database setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Verify .env has correct database credentials"
Write-Host "  2. Run 'npm install' to install dependencies"
Write-Host "  3. Run 'npm run dev' to start the server"
