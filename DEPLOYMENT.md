# Deployment Recipe

This documents the deployment shape used by this template without including any private cloud resources.

## 1. Create A Paper Table

Create a BigQuery table with:

```text
id,title,abstract
```

`get_dutch_papers.sql` is an example that extracts Dutch-affiliated OpenAlex papers from the public CWTS OpenAlex BigQuery dataset.

## 2. Generate Embeddings

Open `dutch_embeddings.ipynb` and edit the first config cell:

```text
BQ_TABLE = 'YOUR_PROJECT.YOUR_DATASET.YOUR_PAPERS_TABLE'
BILLED_PROJECT = 'YOUR_PROJECT'
GCS_OUTPUT = 'gs://YOUR_BUCKET/dutch_embeddings/'
```

Run the notebook in Colab with a GPU runtime. It writes SPECTER2 embedding Parquet parts to Cloud Storage.

## 3. Reduce To Map Coordinates

Run your UMAP workflow over the embeddings and export coordinate files for the map. The viewer expects:

```text
work_id,x,y
```

The included UI has selectors for `n_neighbors` values of `15`, `25`, `50`, `100`, and `200`.

## 4. Export Viewer CSVs

Create:

```text
google_cloud_prototype/data/paperdata.csv
google_cloud_prototype/data/coordinates_15.csv
google_cloud_prototype/data/coordinates_25.csv
google_cloud_prototype/data/coordinates_50.csv
google_cloud_prototype/data/coordinates_100.csv
google_cloud_prototype/data/coordinates_200.csv
```

`paperdata.csv` must contain:

```text
work_id,publication_year,title,abstract
```

## 5. Preview Locally

```powershell
cd google_cloud_prototype
python -m http.server 8080
```

Open `http://localhost:8080`.

## 6. Deploy Static Files

Create a public bucket:

```powershell
.\cloud\setup_public_bucket.ps1 `
  -ProjectId "YOUR_PROJECT" `
  -BucketName "YOUR_BUCKET" `
  -Location "EU"
```

Upload the site:

```powershell
.\cloud\upload_public_site.ps1 `
  -BucketName "YOUR_BUCKET" `
  -SiteDir ".\google_cloud_prototype"
```

Open:

```text
https://storage.googleapis.com/YOUR_BUCKET/index.html
```
