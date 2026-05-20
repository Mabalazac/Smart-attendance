# PowerShell Script to zip the project for sharing (excluding node_modules and venv)

$ProjectRoot = Get-Item .
$TempFolder = Join-Path $ProjectRoot.FullName "temp_zip_folder"
$ZipFile = Join-Path $ProjectRoot.FullName "presentation_project.zip"

# Clean up any existing temp folder or zip file
if (Test-Path $TempFolder) { Remove-Item -Recurse -Force $TempFolder }
if (Test-Path $ZipFile) { Remove-Item -Force $ZipFile }

# Create temporary staging directory
New-Item -ItemType Directory -Path $TempFolder | Out-Null

Write-Host "Staging files to zip (excluding venv and node_modules)..." -ForegroundColor Cyan

# Copy root files
Get-ChildItem -Path $ProjectRoot.FullName -File | ForEach-Object {
    if ($_.Name -ne "presentation_project.zip" -and $_.Name -ne "project.zip" -and $_.Name -ne "zip_project.ps1") {
        Copy-Item -Path $_.FullName -Destination $TempFolder -Force
    }
}

# Copy backend (excluding venv, __pycache__, and db.sqlite3 if needed - we keep db.sqlite3 since it might be useful as fallback)
$BackendDest = Join-Path $TempFolder "backend"
New-Item -ItemType Directory -Path $BackendDest | Out-Null
Copy-Item -Path (Join-Path $ProjectRoot.FullName "backend\*") -Destination $BackendDest -Recurse -Force -Exclude "venv", "__pycache__"

# Remove venv and pycache from backend destination specifically to make sure
if (Test-Path (Join-Path $BackendDest "venv")) { Remove-Item -Recurse -Force (Join-Path $BackendDest "venv") }
Get-ChildItem -Path $BackendDest -Recurse -Directory -Filter "__pycache__" | ForEach-Object { Remove-Item -Recurse -Force $_.FullName }

# Copy frontend (excluding node_modules)
$FrontendDest = Join-Path $TempFolder "frontend"
New-Item -ItemType Directory -Path $FrontendDest | Out-Null
Copy-Item -Path (Join-Path $ProjectRoot.FullName "frontend\*") -Destination $FrontendDest -Recurse -Force -Exclude "node_modules", "dist"

# Remove node_modules and dist from frontend destination specifically to make sure
if (Test-Path (Join-Path $FrontendDest "node_modules")) { Remove-Item -Recurse -Force (Join-Path $FrontendDest "node_modules") }
if (Test-Path (Join-Path $FrontendDest "dist")) { Remove-Item -Recurse -Force (Join-Path $FrontendDest "dist") }

Write-Host "Compressing files into presentation_project.zip..." -ForegroundColor Cyan

# Zip the staging folder
Compress-Archive -Path (Join-Path $TempFolder "*") -DestinationPath $ZipFile -Force

# Clean up
Remove-Item -Recurse -Force $TempFolder

Write-Host "Project successfully zipped as: presentation_project.zip" -ForegroundColor Green
Write-Host "You can now share this zip file directly with your partner." -ForegroundColor Green
