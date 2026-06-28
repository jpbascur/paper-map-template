# Adapt This Project For Your Data

This repository is meant to be reusable. A chatbot or developer should only need to replace the data source and keep the same output contracts.

## Input Papers

The embedding notebook expects a BigQuery table with these columns:

```text
id,title,abstract
```

For a non-Dutch dataset, replace `get_dutch_papers.sql` with a query that writes your own paper table in that shape.

## Embeddings

Open `dutch_embeddings.ipynb` and edit the first config cell:

```text
BQ_TABLE = 'YOUR_PROJECT.YOUR_DATASET.YOUR_PAPERS_TABLE'
BILLED_PROJECT = 'YOUR_PROJECT'
GCS_OUTPUT = 'gs://YOUR_BUCKET/dutch_embeddings/'
```

The notebook writes SPECTER2 embeddings as Parquet parts.

## Viewer Data

The cloud prototype expects these files:

```text
google_cloud_prototype/data/paperdata.csv
google_cloud_prototype/data/coordinates_15.csv
google_cloud_prototype/data/coordinates_25.csv
google_cloud_prototype/data/coordinates_50.csv
google_cloud_prototype/data/coordinates_100.csv
google_cloud_prototype/data/coordinates_200.csv
```

`paperdata.csv` columns:

```text
work_id,publication_year,title,abstract
```

Coordinate CSV columns:

```text
work_id,x,y
```

The `work_id` values must match between metadata and coordinate files.

## Static Hosting

To share the viewer, upload `google_cloud_prototype/` to any static host. For Google Cloud Storage, use the scripts in `cloud/` and pass your own project and bucket names.
