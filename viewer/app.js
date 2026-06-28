const {Deck, OrthographicView} = deck;
const {ScatterplotLayer} = deck;

const mapEl = document.getElementById("map");
const statusEl = document.getElementById("status");
const fileInput = document.getElementById("fileInput");
const dataUrl = document.getElementById("dataUrl");
const loadUrl = document.getElementById("loadUrl");
const searchInput = document.getElementById("searchInput");
const resultsEl = document.getElementById("results");
const detailsEl = document.getElementById("details");
const yearMinEl = document.getElementById("yearMin");
const yearMaxEl = document.getElementById("yearMax");
const yearMinInput = document.getElementById("yearMinInput");
const yearMaxInput = document.getElementById("yearMaxInput");
const zoomInButton = document.getElementById("zoomIn");
const zoomOutButton = document.getElementById("zoomOut");
const resetViewButton = document.getElementById("resetView");
const tooltipToggle = document.getElementById("tooltipToggle");

const VIEWER_VERSION = "deck-9";

let points = [];
let selectedWorkId = null;
let yearDomain = null;
let fittedViewState = null;
let showTooltips = false;
let viewState = {
  target: [0, 0, 0],
  zoom: 1
};

const deckgl = new Deck({
  parent: mapEl,
  views: [new OrthographicView({id: "main"})],
  controller: {scrollZoom: true, dragPan: true, doubleClickZoom: true},
  initialViewState: viewState,
  getCursor: () => "default",
  getTooltip: ({object}) => {
    if (!showTooltips || !object) return null;
    return {
      text: `${object.title || "Untitled"}\n${object.publication || "-"}`,
      style: {
        maxWidth: "360px",
        whiteSpace: "normal",
        overflowWrap: "anywhere"
      }
    };
  },
  onViewStateChange: ({viewState: nextViewState}) => {
    setViewState(nextViewState);
  },
  pickingRadius: 14,
  layers: []
});

function setViewState(nextViewState) {
  viewState = nextViewState;
  deckgl.setProps({viewState});
}

function setStatus(message) {
  statusEl.textContent = message;
}

function parsePoint(row) {
  const x = Number(row.x);
  const y = Number(row.y);
  const year = Number(row.publication_year || row.year || "");
  return {
    work_id: String(row.work_id || row.id || ""),
    x,
    y,
    publication_year: Number.isFinite(year) ? year : null,
    publication: row.publication_year || row.year || "-",
    title: row.title || "",
    abstract: row.abstract || ""
  };
}

function normalizeRows(rows) {
  return rows
    .map(parsePoint)
    .filter((d) => d.work_id && Number.isFinite(d.x) && Number.isFinite(d.y));
}

function fitToPoints(data) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const point of data) {
    if (point.x < minX) minX = point.x;
    if (point.x > maxX) maxX = point.x;
    if (point.y < minY) minY = point.y;
    if (point.y > maxY) maxY = point.y;
  }

  const width = Math.max(1, mapEl.clientWidth);
  const height = Math.max(1, mapEl.clientHeight);
  const rangeX = Math.max(1e-6, maxX - minX);
  const rangeY = Math.max(1e-6, maxY - minY);
  const scale = Math.min(width / (rangeX * 1.14), height / (rangeY * 1.14));

  setViewState({
    target: [(minX + maxX) / 2, (minY + maxY) / 2, 0],
    zoom: Math.log2(scale)
  });
  fittedViewState = {...viewState, target: [...viewState.target]};
}

function buildColorScale(data) {
  let minYear = Infinity;
  let maxYear = -Infinity;

  for (const point of data) {
    if (!Number.isFinite(point.publication_year)) continue;
    if (point.publication_year < minYear) minYear = point.publication_year;
    if (point.publication_year > maxYear) maxYear = point.publication_year;
  }

  if (minYear === Infinity) {
    yearDomain = null;
    yearMinEl.textContent = "No dates";
    yearMaxEl.textContent = "";
    yearMinInput.value = "";
    yearMaxInput.value = "";
  } else {
    yearDomain = [minYear, maxYear === minYear ? minYear + 1 : maxYear];
    syncYearLabelsAndInputs();
  }
}

function syncYearLabelsAndInputs() {
  if (!yearDomain) return;
  yearMinEl.textContent = String(yearDomain[0]);
  yearMaxEl.textContent = String(yearDomain[1]);
  yearMinInput.value = String(yearDomain[0]);
  yearMaxInput.value = String(yearDomain[1]);
}

function applyYearInputs() {
  const minYear = Number(yearMinInput.value);
  const maxYear = Number(yearMaxInput.value);
  if (!Number.isFinite(minYear) || !Number.isFinite(maxYear) || minYear >= maxYear) {
    setStatus("Year range must have a numeric min smaller than max.");
    return;
  }
  yearDomain = [minYear, maxYear];
  yearMinEl.textContent = String(minYear);
  yearMaxEl.textContent = String(maxYear);
  render();
}

function colorForPoint(point) {
  if (!Number.isFinite(point.publication_year) || !yearDomain) return [145, 150, 156, 135];
  const t = Math.max(0, Math.min(1, (point.publication_year - yearDomain[0]) / (yearDomain[1] - yearDomain[0])));
  const c = interpolateYearPalette(t);
  return [c[0], c[1], c[2], 205];
}

function interpolateYearPalette(t) {
  const stops = [
    [44, 123, 182],
    [49, 163, 169],
    [53, 183, 121],
    [139, 213, 72],
    [253, 231, 37]
  ];
  const scaled = t * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(scaled));
  const f = scaled - i;
  return [
    Math.round(stops[i][0] + (stops[i + 1][0] - stops[i][0]) * f),
    Math.round(stops[i][1] + (stops[i + 1][1] - stops[i][1]) * f),
    Math.round(stops[i][2] + (stops[i + 1][2] - stops[i][2]) * f)
  ];
}

function render() {
  const colorTrigger = yearDomain ? yearDomain.join(":") : "none";
  const layer = new ScatterplotLayer({
    id: "papers",
    data: points,
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 210],
    radiusUnits: "pixels",
    lineWidthUnits: "pixels",
    getPosition: (d) => [d.x, d.y, 0],
    getFillColor: colorForPoint,
    getRadius: (d) => d.work_id === selectedWorkId ? 6 : 2.2,
    stroked: false,
    updateTriggers: {
      getFillColor: colorTrigger,
      getRadius: selectedWorkId
    },
    onClick: ({object}) => {
      if (object) selectPaper(object, false);
    }
  });

  deckgl.setProps({
    viewState,
    getTooltip: ({object}) => {
      if (!showTooltips || !object) return null;
      return {
        text: `${object.title || "Untitled"}\n${object.publication || "-"}`,
        style: {
          maxWidth: "360px",
          whiteSpace: "normal",
          overflowWrap: "anywhere"
        }
      };
    },
    layers: [layer]
  });
}

function zoomBy(delta) {
  setViewState({
    ...viewState,
    zoom: Math.max(-20, Math.min(20, viewState.zoom + delta))
  });
  render();
}

function resetView() {
  if (!fittedViewState) return;
  setViewState({...fittedViewState, target: [...fittedViewState.target]});
  render();
}

function selectPaper(point, zoomTo = true) {
  selectedWorkId = point.work_id;
  detailsEl.querySelector("h2").textContent = point.title || "Untitled paper";
  const dds = detailsEl.querySelectorAll("dd");
  dds[0].textContent = point.work_id;
  dds[1].textContent = point.publication || "-";
  detailsEl.querySelector("p").textContent = point.abstract || "No abstract column provided.";

  if (zoomTo) {
    setViewState({
      ...viewState,
      target: [point.x, point.y, 0],
      zoom: Math.max(viewState.zoom, 8)
    });
  }
  render();
}

function updateSearchResults(query) {
  resultsEl.innerHTML = "";
  const q = query.trim().toLowerCase();
  if (!q || points.length === 0) return;

  const matches = [];
  for (const point of points) {
    const haystack = `${point.work_id} ${point.title}`.toLowerCase();
    if (haystack.includes(q)) matches.push(point);
    if (matches.length >= 30) break;
  }

  for (const point of matches) {
    const button = document.createElement("button");
    button.className = "result";
    button.innerHTML = `<strong>${escapeHtml(point.title || "Untitled")}</strong><span>${escapeHtml(point.work_id)} - ${escapeHtml(String(point.publication || "-"))}</span>`;
    button.addEventListener("click", () => selectPaper(point, true));
    resultsEl.appendChild(button);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadCsvText(text, label) {
  setStatus(`Parsing ${label}...`);
  const rows = d3.csvParse(text);
  points = normalizeRows(rows);
  if (!points.length) {
    setStatus("No valid points found. Expected columns: work_id, x, y, publication_year, title.");
    return;
  }
  buildColorScale(points);
  fitToPoints(points);
  selectedWorkId = null;
  resultsEl.innerHTML = "";
  searchInput.value = "";
  setStatus(`Loaded ${points.length.toLocaleString()} papers.`);
  render();
}

async function loadFromUrl(url) {
  setStatus(`Loading ${url}...`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  await loadCsvText(await response.text(), url);
}

fileInput.addEventListener("change", async (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  try {
    await loadCsvText(await file.text(), file.name);
  } catch (error) {
    setStatus(`Could not render data: ${error.message}`);
  }
});

loadUrl.addEventListener("click", async () => {
  try {
    await loadFromUrl(dataUrl.value.trim());
  } catch (error) {
    setStatus(`Could not load data: ${error.message}`);
  }
});

searchInput.addEventListener("input", () => updateSearchResults(searchInput.value));
zoomInButton.addEventListener("click", () => zoomBy(1));
zoomOutButton.addEventListener("click", () => zoomBy(-1));
resetViewButton.addEventListener("click", resetView);
tooltipToggle.addEventListener("change", () => {
  showTooltips = tooltipToggle.checked;
  render();
});
yearMinInput.addEventListener("change", applyYearInputs);
yearMaxInput.addEventListener("change", applyYearInputs);

setStatus(`Deck renderer ${VIEWER_VERSION} ready. Load a CSV file or provide a data URL.`);
