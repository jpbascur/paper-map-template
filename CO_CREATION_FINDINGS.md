# Co-Creation Findings

This note records the main design decisions and implementation lessons from building the Dutch OpenAlex embedding workflow.

## BigQuery Location

- The CWTS OpenAlex BigQuery dataset is in the `EU` location.
- A Google Cloud project is not itself `EU` or `US`; individual BigQuery datasets have locations.
- Destination datasets for queries over `cwts-leiden.openalex_2025aug` must also be in `EU`.
- The destination dataset used for this workflow should be in the `EU` location, for example `YOUR_PROJECT.YOUR_DATASET`.
- Colab BigQuery jobs should pass `location='EU'` explicitly.

## Source Data

- The extracted source table should contain one row per paper, for example `YOUR_PROJECT.YOUR_DATASET.dutch_papers`.
- It contains `id`, `title`, and `abstract`.
- Titles and abstracts come from `work_title` and `work_abstract`, joined to CWTS OpenAlex works.
- Missing `title` or missing `abstract` defines an excluded paper for the embedding run.
- The documentation query counts excluded and non-excluded papers by publication year by joining `dutch_papers.id` back to `cwts-leiden.openalex_2025aug.work`.

## Embedding Inclusion Rule

- The notebook embeds only rows where both `title` and `abstract` are present.
- Rows missing either field receive NaN embeddings.
- This keeps the generated embeddings consistent with the documented exclusion counts.

## Colab Runtime

- The notebook is intended for Colab with a GPU runtime.
- Dependencies are installed inside the notebook, including:
  - `adapters`
  - `transformers`
  - `gcsfs`
  - `google-cloud-bigquery-storage`
  - `db-dtypes`
- `google-cloud-bigquery-storage` and `db-dtypes` are included so `to_dataframe(create_bqstorage_client=True)` works reliably in Colab.

## Checkpointing And Memory

- The first implementation risk was allocating all embeddings and merging all checkpoints in memory.
- The notebook now processes one `CHECKPOINT_EVERY` window at a time.
- Each window is written immediately as a checkpoint Parquet file on Google Drive.
- The final upload step copies checkpoint Parquet parts directly to GCS.
- It does not read all checkpoint files and concatenate them in RAM.

## GCS Output

- Use a Cloud Storage bucket that you control.
- Embedding outputs are written under:

```text
gs://YOUR_BUCKET/dutch_embeddings/
```

- The output is a Parquet dataset folder containing multiple `batch_*.parquet` parts, not one large merged Parquet file.

## BigQuery Embedding Type

- We tested scalar Parquet `float16` columns.
- BigQuery loaded them as `BYTES`, not numeric values.
- BigQuery does not provide a native `FLOAT16` column type.
- Because BigQuery's numeric floating-point type is `FLOAT64`, the notebook writes embeddings as `ARRAY<FLOAT64>`.
- The output schema is:

```text
work_id INTEGER
embedding ARRAY<FLOAT64>
```

## Loading Embeddings Into BigQuery

After Colab uploads the Parquet parts, load them into one BigQuery table with:

```bash
bq --location=EU load \
  --replace \
  --source_format=PARQUET \
  YOUR_PROJECT:YOUR_DATASET.dutch_embeddings \
  "gs://YOUR_BUCKET/dutch_embeddings/*.parquet"
```

## Remaining Tradeoffs

- `FLOAT64` makes the embedding table larger than `float16`, but it avoids BigQuery type problems.
- The notebook still loads the full `dutch_papers` table into a dataframe. This is acceptable on a high-RAM Colab runtime, but true streaming from BigQuery would be safer for smaller runtimes.
- The checkpoint folder on Drive should be cleared or versioned deliberately before rerunning a materially different embedding job.
