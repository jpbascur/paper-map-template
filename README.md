# Paper Map Template

This is a reusable template for building a static paper-map viewer from paper metadata, embeddings, and UMAP coordinates.

It contains:

- a browser-based WebGL viewer in `google_cloud_prototype/`
- a simple CSV-loading viewer in `viewer/`
- a Dutch OpenAlex example extractor in `get_dutch_papers.sql`
- a SPECTER2 embedding notebook in `dutch_embeddings.ipynb`
- Google Cloud Storage deployment scripts in `cloud/`
- tiny sample CSVs so the prototype can run immediately

No private project IDs, buckets, credentials, or full generated datasets are included.

## Run The Sample Viewer

From this folder:

```powershell
cd google_cloud_prototype
python -m http.server 8080
```

If `python` is not on your PATH but Node.js is installed:

```powershell
cd google_cloud_prototype
npx http-server -p 8080
```

Open:

```text
http://localhost:8080
```

## Data Contract

The cloud prototype expects:

```text
google_cloud_prototype/data/paperdata.csv
google_cloud_prototype/data/coordinates_15.csv
google_cloud_prototype/data/coordinates_25.csv
google_cloud_prototype/data/coordinates_50.csv
google_cloud_prototype/data/coordinates_100.csv
google_cloud_prototype/data/coordinates_200.csv
```

`paperdata.csv`:

```text
work_id,publication_year,title,abstract
```

Coordinate files:

```text
work_id,x,y
```

The `work_id` values must match between metadata and coordinate files.

## Adapt It

Read `ADAPT_FOR_YOUR_DATA.md` for the short path. Read `DEPLOYMENT.md` for the full deployment recipe.
