function initBackgroundCleanup() {
  let sourceFile = null;
  let sourceImage = null;
  let sourceUrl = "";
  let resultBlob = null;
  let resultUrl = "";
  let processedOnce = false;
  let reprocessTimer = null;

  renderShell(`
    <h2>Background settings</h2>
    <div class="control-grid">
      <label class="drop-zone enhanced-drop" for="bg-input" id="bg-drop">
        <strong>Upload product photo</strong>
        <span id="bg-file-name">PNG, JPG, WEBP, or any browser-readable image.</span>
      </label>
      <input class="file-input" id="bg-input" type="file" accept="image/*">
      <div class="control-row inline">
        <div>
          <label for="bg-threshold">Removal strength <span class="value-pill" id="bg-threshold-value">42</span></label>
          <input id="bg-threshold" type="range" min="5" max="140" value="42">
        </div>
        <div>
          <label for="bg-max">Max width, px</label>
          <input id="bg-max" type="number" min="256" max="4000" value="1400">
        </div>
      </div>
      <div class="control-row inline">
        <div>
          <label for="bg-mode">Output background</label>
          <select id="bg-mode">
            <option value="transparent">Transparent PNG</option>
            <option value="color">Solid color</option>
          </select>
        </div>
        <div>
          <label for="bg-color">Fill color</label>
          <input id="bg-color" type="color" value="#ffffff">
        </div>
      </div>
      <div class="control-row">
        <label for="bg-sample">Background sample</label>
        <select id="bg-sample">
          <option value="corners">Auto sample all corners</option>
          <option value="top-left">Top-left corner only</option>
          <option value="top-right">Top-right corner only</option>
          <option value="bottom-left">Bottom-left corner only</option>
          <option value="bottom-right">Bottom-right corner only</option>
        </select>
      </div>
      <div class="button-row">
        <button class="primary-button" id="bg-process" type="button">Remove background</button>
        <button class="secondary-button" id="bg-reset" type="button" disabled>Reset preview</button>
        <button class="secondary-button" id="bg-download" type="button" disabled>Download PNG</button>
      </div>
      <p class="status" data-status>Upload an image to begin.</p>
    </div>
  `, `
    <div class="preview-header">
      <div>
        <h2>Live preview</h2>
        <p>Compare the original with the cleaned PNG before downloading.</p>
      </div>
      <span class="preview-badge" id="bg-preview-badge">Waiting for image</span>
    </div>
    <div class="result-area" id="bg-preview"></div>
  `);

  document.body.classList.add("background-tool");
  const workspace = document.querySelector(".workspace");
  const resultPanel = workspace?.querySelector(".result-panel");
  if (resultPanel) document.querySelector(".tool-hero")?.append(resultPanel);
  workspace?.remove();

  const input = document.querySelector("#bg-input");
  const drop = document.querySelector("#bg-drop");
  const fileName = document.querySelector("#bg-file-name");
  const threshold = document.querySelector("#bg-threshold");
  const thresholdValue = document.querySelector("#bg-threshold-value");
  const maxWidth = document.querySelector("#bg-max");
  const mode = document.querySelector("#bg-mode");
  const color = document.querySelector("#bg-color");
  const sample = document.querySelector("#bg-sample");
  const preview = document.querySelector("#bg-preview");
  const badge = document.querySelector("#bg-preview-badge");
  const processButton = document.querySelector("#bg-process");
  const resetButton = document.querySelector("#bg-reset");
  const downloadButton = document.querySelector("#bg-download");

  renderPreview();

  function renderPreview(meta = null) {
    if (!sourceImage) {
      preview.innerHTML = `
        <div class="empty-state tool-empty">
          <strong>No image selected.</strong>
          <span>Upload an image and the original preview will appear here.</span>
        </div>
      `;
      badge.textContent = "Waiting for image";
      return;
    }

    const afterContent = resultUrl
      ? `<img src="${resultUrl}" alt="Cleaned background preview">`
      : `<div class="preview-placeholder"><strong>Ready to clean</strong><span>Press Remove background to generate a PNG preview.</span></div>`;
    const afterClass = resultUrl ? "preview-media checker-media" : "preview-media";
    const metaHtml = meta
      ? `
        <div class="mini-stat-grid">
          <div class="mini-stat"><span>Removed</span><strong>${meta.removedPercent}%</strong></div>
          <div class="mini-stat"><span>Output</span><strong>${meta.width} x ${meta.height}</strong></div>
          <div class="mini-stat"><span>PNG size</span><strong>${formatBytes(meta.size)}</strong></div>
        </div>
      `
      : "";

    preview.innerHTML = `
      <div class="preview-grid bg-preview-grid">
        <article class="preview-card">
          <div class="preview-media">
            <img src="${sourceUrl}" alt="Original image preview">
          </div>
          <footer><span>Original</span><strong>${formatBytes(sourceFile.size)}</strong></footer>
        </article>
        <article class="preview-card">
          <div class="${afterClass}">
            ${afterContent}
          </div>
          <footer><span>Cleaned preview</span><strong>${resultBlob ? formatBytes(resultBlob.size) : "Not generated"}</strong></footer>
        </article>
      </div>
      ${metaHtml}
    `;
    badge.textContent = resultUrl ? "Preview ready" : "Image loaded";
  }

  async function loadSelectedFile(file) {
    if (!file) return;
    sourceFile = file;
    resultBlob = null;
    processedOnce = false;
    resetButton.disabled = true;
    downloadButton.disabled = true;
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = "";
    sourceUrl = await readAsDataUrl(file);
    sourceImage = await loadImageFromUrl(sourceUrl);
    fileName.textContent = `${file.name} · ${formatBytes(file.size)}`;
    renderPreview();
    setStatus("Image loaded. Tune the controls, then remove the background.");
  }

  async function processBackground() {
    if (!sourceImage) {
      setStatus("Please upload an image first.", "warn");
      return;
    }

    setStatus("Removing matching background pixels...");
    badge.textContent = "Processing";

    const limit = Number(maxWidth.value) || 1400;
    const scale = Math.min(limit / sourceImage.naturalWidth, 1);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(sourceImage.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(sourceImage.naturalHeight * scale));
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const strength = Number(threshold.value);
    const fill = hexToRgb(color.value);
    const background = getSampleColor(data, canvas.width, canvas.height, sample.value);
    let removed = 0;

    for (let index = 0; index < data.length; index += 4) {
      const distance = colorDistance([data[index], data[index + 1], data[index + 2]], background);
      if (distance < strength) {
        removed += 1;
        if (mode.value === "transparent") {
          data[index + 3] = 0;
        } else {
          data[index] = fill.r;
          data[index + 1] = fill.g;
          data[index + 2] = fill.b;
          data[index + 3] = 255;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    resultBlob = await canvasToBlob(canvas, "image/png", .95);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = URL.createObjectURL(resultBlob);
    processedOnce = true;
    resetButton.disabled = false;
    downloadButton.disabled = false;

    const meta = {
      removedPercent: Math.round((removed / (canvas.width * canvas.height)) * 100),
      width: canvas.width,
      height: canvas.height,
      size: resultBlob.size
    };
    renderPreview(meta);
    setStatus("Preview ready. Adjust settings to auto-refresh, or download the PNG.", "good");
    if (window.matchMedia("(max-width: 700px)").matches) {
      document.querySelector(".result-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function resetPreview() {
    resultBlob = null;
    processedOnce = false;
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = "";
    resetButton.disabled = true;
    downloadButton.disabled = true;
    renderPreview();
    setStatus(sourceImage ? "Preview reset. Run background removal again." : "Upload an image to begin.");
  }

  function scheduleReprocess() {
    thresholdValue.textContent = threshold.value;
    if (!processedOnce) return;
    clearTimeout(reprocessTimer);
    reprocessTimer = setTimeout(processBackground, 180);
  }

  input.addEventListener("change", () => loadSelectedFile(input.files?.[0]));
  processButton.addEventListener("click", processBackground);
  resetButton.addEventListener("click", resetPreview);
  downloadButton.addEventListener("click", () => {
    if (resultBlob && sourceFile) downloadBlob(resultBlob, safeName(sourceFile.name, "-background-removed", "png"));
  });

  [threshold, maxWidth, mode, color, sample].forEach((control) => {
    control.addEventListener("input", scheduleReprocess);
    control.addEventListener("change", scheduleReprocess);
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    drop.addEventListener(eventName, (event) => {
      event.preventDefault();
      drop.classList.add("is-dragging");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    drop.addEventListener(eventName, (event) => {
      event.preventDefault();
      drop.classList.remove("is-dragging");
    });
  });

  drop.addEventListener("drop", (event) => loadSelectedFile(event.dataTransfer?.files?.[0]));
}

function getSampleColor(data, width, height, mode) {
  const samples = {
    "top-left": [pixelAt(data, width, 0, 0)],
    "top-right": [pixelAt(data, width, width - 1, 0)],
    "bottom-left": [pixelAt(data, width, 0, height - 1)],
    "bottom-right": [pixelAt(data, width, width - 1, height - 1)]
  };
  return averageColor(samples[mode] || [
    pixelAt(data, width, 0, 0),
    pixelAt(data, width, width - 1, 0),
    pixelAt(data, width, 0, height - 1),
    pixelAt(data, width, width - 1, height - 1)
  ]);
}
