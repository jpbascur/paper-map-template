param(
    [Parameter(Mandatory = $true)]
    [string] $BucketName,

    [Parameter(Mandatory = $true)]
    [string] $SiteDir
)

$ErrorActionPreference = "Stop"

$bucketUri = "gs://$BucketName"
$resolvedSiteDir = Resolve-Path -LiteralPath $SiteDir
$dataDir = Join-Path $resolvedSiteDir "data"

Write-Host "Uploading static app files."
gcloud storage cp (Join-Path $resolvedSiteDir "index.html") "$bucketUri/index.html"
gcloud storage cp (Join-Path $resolvedSiteDir "styles.css") "$bucketUri/styles.css"
gcloud storage cp (Join-Path $resolvedSiteDir "app.js") "$bucketUri/app.js"

if (Test-Path -LiteralPath (Join-Path $resolvedSiteDir "404.html")) {
    gcloud storage cp (Join-Path $resolvedSiteDir "404.html") "$bucketUri/404.html"
}

if (Test-Path -LiteralPath $dataDir) {
    Write-Host "Uploading data files."
    gcloud storage cp --recursive "$dataDir\*" "$bucketUri/data/"
}

Write-Host "Setting short cache headers for app shell."
gcloud storage objects update "$bucketUri/index.html" --cache-control="no-cache"
gcloud storage objects update "$bucketUri/app.js" --cache-control="no-cache"
gcloud storage objects update "$bucketUri/styles.css" --cache-control="no-cache"

Write-Host "Setting longer cache headers for data files."
gcloud storage objects update "$bucketUri/data/*" --cache-control="public, max-age=86400"

Write-Host ""
Write-Host "Uploaded:"
Write-Host "  https://storage.googleapis.com/$BucketName/index.html"
