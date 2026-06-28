# Cloud Bucket Setup

Use this when you are ready to generate fresh data yourself and upload a new prototype from scratch.

## Create The Public Bucket

From the repository root:

```powershell
.\cloud\setup_public_bucket.ps1 `
  -ProjectId "YOUR_PROJECT" `
  -BucketName "YOUR_BUCKET" `
  -Location "EU"
```

Bucket names are globally unique. If that name is taken, choose another one, for example:

```text
paper-map-prototype-yourname
```

The script configures:

- uniform bucket-level access
- public read access for objects
- CORS for browser `fetch()` requests
- static website index settings

## Recommended File Layout

Upload files like this:

```text
gs://YOUR_BUCKET/
  index.html
  styles.css
  app.js
  data/
    paperdata.csv
    coordinates_15.csv
    coordinates_25.csv
    coordinates_50.csv
    coordinates_100.csv
    coordinates_200.csv
```

The public object URL format is:

```text
https://storage.googleapis.com/YOUR_BUCKET/index.html
```

## Upload Example

After generating the clean files:

```powershell
gcloud storage cp .\public_site\index.html gs://YOUR_BUCKET/index.html
gcloud storage cp .\public_site\styles.css gs://YOUR_BUCKET/styles.css
gcloud storage cp .\public_site\app.js gs://YOUR_BUCKET/app.js
gcloud storage cp .\public_site\data\*.csv gs://YOUR_BUCKET/data/
```

For frequently edited HTML/JS/CSS, use short cache headers:

```powershell
gcloud storage objects update gs://YOUR_BUCKET/index.html --cache-control="no-cache"
gcloud storage objects update gs://YOUR_BUCKET/app.js --cache-control="no-cache"
gcloud storage objects update gs://YOUR_BUCKET/styles.css --cache-control="no-cache"
```

For generated data files that will not change often:

```powershell
gcloud storage objects update gs://YOUR_BUCKET/data/*.csv --cache-control="public, max-age=86400"
```
