param(
    [Parameter(Mandatory = $true)]
    [string] $ProjectId,

    [Parameter(Mandatory = $true)]
    [string] $BucketName,

    [string] $Location = "EU",
    [string] $StorageClass = "STANDARD"
)

$ErrorActionPreference = "Stop"

$bucketUri = "gs://$BucketName"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$corsFile = Join-Path $scriptDir "cors.json"

Write-Host "Using project: $ProjectId"
gcloud config set project $ProjectId | Out-Null

$bucketExists = $false
gcloud storage buckets describe $bucketUri *> $null
if ($LASTEXITCODE -eq 0) {
    $bucketExists = $true
}

if (-not $bucketExists) {
    Write-Host "Creating bucket: $bucketUri"
    gcloud storage buckets create $bucketUri `
        --project=$ProjectId `
        --location=$Location `
        --uniform-bucket-level-access `
        --default-storage-class=$StorageClass
} else {
    Write-Host "Bucket already exists: $bucketUri"
    gcloud storage buckets update $bucketUri --uniform-bucket-level-access
}

Write-Host "Setting CORS for browser CSV/data loading."
gcloud storage buckets update $bucketUri --cors-file=$corsFile

Write-Host "Making bucket objects publicly readable."
gcloud storage buckets add-iam-policy-binding $bucketUri `
    --member="allUsers" `
    --role="roles/storage.objectViewer"

Write-Host "Configuring static website index page."
gcloud storage buckets update $bucketUri `
    --web-main-page-suffix=index.html `
    --web-error-page=404.html

Write-Host ""
Write-Host "Bucket ready:"
Write-Host "  $bucketUri"
Write-Host ""
Write-Host "Use this public base URL for files:"
Write-Host "  https://storage.googleapis.com/$BucketName/"
