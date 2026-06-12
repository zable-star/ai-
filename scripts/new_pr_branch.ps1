param(
    [Parameter(Mandatory = $true)]
    [string] $Name
)

$ErrorActionPreference = "Stop"

$slug = $Name.ToLowerInvariant()
$slug = $slug -replace "[^a-z0-9]+", "-"
$slug = $slug.Trim("-")

if ([string]::IsNullOrWhiteSpace($slug)) {
    Write-Error "Branch name cannot be empty after normalization."
    exit 1
}

$branch = "feature/$slug"
git checkout -b $branch
Write-Host "Created branch: $branch"

