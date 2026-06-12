$ErrorActionPreference = "Stop"

Write-Host "== Qiniu competition preflight =="

try {
    $repoRoot = git rev-parse --show-toplevel
} catch {
    Write-Error "This directory is not a Git repository."
    exit 1
}

Write-Host "Repo root: $repoRoot"
Write-Host ""

Write-Host "== Git status =="
git status --short --branch
Write-Host ""

Write-Host "== Git remotes =="
git remote -v
Write-Host ""

Write-Host "== Required files =="
$requiredFiles = @(
    "README.md",
    "docs/competition-brief.md",
    "docs/topic-intake.md",
    "docs/implementation-plan.md",
    "docs/design-doc.md",
    "docs/submission-checklist.md",
    ".github/pull_request_template.md",
    "frontend/index.html",
    "frontend/styles.css",
    "frontend/app.js"
)

$missing = @()
foreach ($file in $requiredFiles) {
    if (Test-Path (Join-Path $repoRoot $file)) {
        Write-Host "[ok] $file"
    } else {
        Write-Host "[missing] $file"
        $missing += $file
    }
}

if ($missing.Count -gt 0) {
    Write-Error "Missing required preparation files."
    exit 1
}

Write-Host ""
Write-Host "== Optional runtimes =="

if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Host "node: $(node --version)"
    Write-Host ""
    Write-Host "== Parser self-test =="
    node frontend/app.js --self-test
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Parser self-test failed."
        exit $LASTEXITCODE
    }
} else {
    Write-Host "node: not found"
}

if (Get-Command npm -ErrorAction SilentlyContinue) {
    Write-Host "npm: $(npm --version)"
} else {
    Write-Host "npm: not found"
}

if (Get-Command python -ErrorAction SilentlyContinue) {
    Write-Host "python: $(python --version)"
} else {
    Write-Host "python: not found"
}

Write-Host ""
Write-Host "Preflight complete."
