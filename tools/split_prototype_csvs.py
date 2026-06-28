import csv
from pathlib import Path


PROTOTYPE_DIR = Path("google_cloud_prototype")
DATA_DIR = PROTOTYPE_DIR / "data"
METADATA_FILE = DATA_DIR / "paperdata.csv"
MAP_FILES = [
    DATA_DIR / "coordinates_15.csv",
    DATA_DIR / "coordinates_25.csv",
    DATA_DIR / "coordinates_50.csv",
    DATA_DIR / "coordinates_100.csv",
    DATA_DIR / "coordinates_200.csv",
]


def write_metadata(source_file: Path) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with source_file.open("r", newline="", encoding="utf-8") as source:
        reader = csv.DictReader(source)
        with METADATA_FILE.open("w", newline="", encoding="utf-8") as target:
            writer = csv.DictWriter(
                target,
                fieldnames=["work_id", "publication_year", "title", "abstract"],
            )
            writer.writeheader()
            for row in reader:
                writer.writerow(
                    {
                        "work_id": row.get("work_id", ""),
                        "publication_year": row.get("publication_year", ""),
                        "title": row.get("title", ""),
                        "abstract": row.get("abstract", ""),
                    }
                )


def rewrite_coordinates(source_file: Path) -> None:
    temp_file = source_file.with_suffix(".coords.tmp")
    with source_file.open("r", newline="", encoding="utf-8") as source:
        reader = csv.DictReader(source)
        with temp_file.open("w", newline="", encoding="utf-8") as target:
            writer = csv.DictWriter(target, fieldnames=["work_id", "x", "y"])
            writer.writeheader()
            for row in reader:
                writer.writerow(
                    {
                        "work_id": row.get("work_id", ""),
                        "x": row.get("x", ""),
                        "y": row.get("y", ""),
                    }
                )
    temp_file.replace(source_file)


def main() -> None:
    write_metadata(MAP_FILES[2])
    for map_file in MAP_FILES:
        rewrite_coordinates(map_file)
        print(f"rewrote {map_file}")
    print(f"wrote {METADATA_FILE}")


if __name__ == "__main__":
    main()
