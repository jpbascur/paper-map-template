# Dutch Paper Map Prototype

This folder is the static prototype package to upload to Google Cloud.

It includes:

- `index.html`
- `styles.css`
- `app.js`
- `data/paperdata.csv` with `work_id`, `publication_year`, `title`, and `abstract`
- five coordinate-only map CSV files for `n_neighbors` 15, 25, 50, 100, and 200

The prototype auto-loads `n_neighbors 50` on startup. The year color scale defaults to 2010-2025, and users can switch between the preloaded `n_neighbors` maps from the sidebar.

The browser loads the metadata file once, then loads only `work_id`, `x`, and `y` when users switch maps.

## Local Preview

Because the viewer uses `fetch()` for local CSV files, preview it with a small static server from this folder:

```powershell
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## Google Cloud Prototype Hosting

For a quick public prototype, upload every file in this folder to one static hosting target, such as Firebase Hosting or a public Cloud Storage bucket configured for static website serving.

Keep all files in the same directory unless you update the CSV paths in `app.js`.
