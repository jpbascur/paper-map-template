import argparse
import ast
from pathlib import Path

import numpy as np
import pandas as pd
import umap


DEFAULT_NEIGHBORS = [15, 25, 50, 100, 200]


def parse_embedding(value):
    if isinstance(value, (list, tuple, np.ndarray)):
        return [float(item) for item in value]
    parsed = ast.literal_eval(str(value))
    if not isinstance(parsed, (list, tuple)):
        raise ValueError("embedding must parse to a list of numbers")
    return [float(item) for item in parsed]


def load_embeddings(path):
    df = pd.read_csv(path)
    if "work_id" not in df.columns:
        raise ValueError("Input embeddings CSV must include a work_id column.")

    if "embedding" in df.columns:
        vectors = df["embedding"].map(parse_embedding).tolist()
    else:
        embedding_columns = [
            column for column in df.columns if column.startswith("embedding_") or column.startswith("emb_")
        ]
        if not embedding_columns:
            raise ValueError(
                "Input embeddings CSV must include either an embedding column with JSON-like lists "
                "or numeric columns named embedding_0/emb_0, embedding_1/emb_1, ..."
            )
        vectors = df[embedding_columns].astype(float).to_numpy().tolist()

    lengths = {len(vector) for vector in vectors}
    if len(lengths) != 1:
        raise ValueError("All embeddings must have the same length.")

    work_ids = df["work_id"].astype(str).to_numpy()
    embeddings = np.asarray(vectors, dtype=np.float32)
    finite_mask = np.isfinite(embeddings).all(axis=1)
    if not finite_mask.all():
        skipped = int((~finite_mask).sum())
        print(f"Skipping {skipped} rows with NaN or infinite embedding values.")
        work_ids = work_ids[finite_mask]
        embeddings = embeddings[finite_mask]

    if len(work_ids) < 3:
        raise ValueError("At least three valid embeddings are required for UMAP.")

    return work_ids, embeddings


def run_umap(embeddings, n_neighbors, min_dist, metric, random_state):
    effective_neighbors = min(int(n_neighbors), len(embeddings) - 1)
    reducer = umap.UMAP(
        n_components=2,
        n_neighbors=effective_neighbors,
        min_dist=float(min_dist),
        metric=metric,
        random_state=int(random_state),
        low_memory=True,
    )
    return reducer.fit_transform(embeddings)


def write_coordinates(work_ids, coords, output_path):
    output = pd.DataFrame(
        {
            "work_id": work_ids,
            "x": coords[:, 0].astype(float),
            "y": coords[:, 1].astype(float),
        }
    )
    output.to_csv(output_path, index=False)


def main():
    parser = argparse.ArgumentParser(
        description="Generate viewer coordinate CSVs from paper embeddings with UMAP."
    )
    parser.add_argument(
        "--embeddings",
        default="sample_data/demo_embeddings.csv",
        help="CSV with work_id and embedding columns. The embedding column should contain JSON-like numeric lists.",
    )
    parser.add_argument(
        "--output-dir",
        default="google_cloud_prototype/data",
        help="Directory where coordinates_*.csv files will be written.",
    )
    parser.add_argument(
        "--neighbors",
        nargs="+",
        type=int,
        default=DEFAULT_NEIGHBORS,
        help="UMAP n_neighbors values to generate.",
    )
    parser.add_argument("--min-dist", type=float, default=0.05)
    parser.add_argument("--metric", default="cosine")
    parser.add_argument("--random-state", type=int, default=42)
    args = parser.parse_args()

    embeddings_path = Path(args.embeddings)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    work_ids, embeddings = load_embeddings(embeddings_path)
    print(f"Loaded {len(work_ids):,} embeddings with {embeddings.shape[1]:,} dimensions.")

    for n_neighbors in args.neighbors:
        effective_neighbors = min(int(n_neighbors), len(work_ids) - 1)
        if effective_neighbors != int(n_neighbors):
            print(
                f"n_neighbors={n_neighbors} is larger than this demo dataset; "
                f"using {effective_neighbors} for the UMAP fit."
            )
        coords = run_umap(
            embeddings,
            n_neighbors=n_neighbors,
            min_dist=args.min_dist,
            metric=args.metric,
            random_state=args.random_state,
        )
        output_path = output_dir / f"coordinates_{int(n_neighbors)}.csv"
        write_coordinates(work_ids, coords, output_path)
        print(f"Wrote {output_path}")


if __name__ == "__main__":
    main()
