(function () {
  const key = document.body.dataset.tool;

  const byId = (id) => document.getElementById(id);
  const wait = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

  function setInputFiles(input, files) {
    const transfer = new DataTransfer();
    files.forEach((file) => transfer.items.add(file));
    input.files = transfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function addToolButton(after, label, onClick) {
    if (!after || after.parentElement.querySelector(`[data-tool-action="${label}"]`)) return null;
    const row = document.createElement("div");
    row.className = "quick-action-row";
    const button = document.createElement("button");
    button.className = "secondary-button";
    button.type = "button";
    button.dataset.toolAction = label;
    button.textContent = label;
    button.addEventListener("click", onClick);
    row.append(button);
    after.insertAdjacentElement("afterend", row);
    return button;
  }

  function wireDrop(label, input) {
    if (!label || !input || label.dataset.dropReady) return;
    label.dataset.dropReady = "true";
    ["dragenter", "dragover"].forEach((eventName) => {
      label.addEventListener(eventName, (event) => {
        event.preventDefault();
        label.classList.add("is-dragging");
      });
    });
    ["dragleave", "drop"].forEach((eventName) => {
      label.addEventListener(eventName, (event) => {
        event.preventDefault();
        label.classList.remove("is-dragging");
      });
    });
    label.addEventListener("drop", (event) => {
      const files = Array.from(event.dataTransfer?.files || []);
      if (files.length) setInputFiles(input, files);
    });
  }

  async function canvasFile(name, width, height, painter) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    painter(canvas.getContext("2d"), canvas);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png", .95));
    return new File([blob], name, { type: "image/png" });
  }

  async function sampleProductImage() {
    return canvasFile("sample-product.png", 900, 620, (ctx, canvas) => {
      const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      bg.addColorStop(0, "#f8fafc");
      bg.addColorStop(1, "#eef8ff");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(15, 23, 42, .18)";
      ctx.shadowBlur = 42;
      ctx.shadowOffsetY = 20;
      roundedRect(ctx, 255, 118, 390, 320, 34);
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.fillStyle = "#1478ff";
      ctx.beginPath();
      ctx.arc(450, 278, 118, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#111111";
      ctx.fillRect(393, 224, 114, 106);
      ctx.fillStyle = "#25bde8";
      ctx.beginPath();
      ctx.arc(384, 210, 30, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  async function sampleScreenshot() {
    return canvasFile("sample-dashboard.png", 1280, 820, (ctx, canvas) => {
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, canvas.width, 76);
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 26px Arial";
      ctx.fillText("Online Converters Analytics", 42, 48);
      const colors = ["#1478ff", "#25bde8", "#38ad6a"];
      for (let i = 0; i < 3; i += 1) {
        ctx.fillStyle = "#ffffff";
        roundedRect(ctx, 52 + i * 392, 130, 332, 190, 18);
        ctx.fill();
        ctx.fillStyle = colors[i];
        ctx.fillRect(84 + i * 392, 246 - i * 24, 44, 44 + i * 24);
        ctx.fillRect(150 + i * 392, 212 - i * 18, 44, 78 + i * 18);
        ctx.fillRect(216 + i * 392, 178 - i * 14, 44, 112 + i * 14);
        ctx.fillStyle = "#111827";
        ctx.font = "700 20px Arial";
        ctx.fillText(["Images", "PDF", "QR"][i], 84 + i * 392, 174);
      }
      ctx.strokeStyle = "#dbe3ee";
      ctx.lineWidth = 2;
      roundedRect(ctx, 52, 380, 1176, 340, 18);
      ctx.stroke();
      ctx.fillStyle = "#334155";
      ctx.font = "600 22px Arial";
      ctx.fillText("Live tool activity", 86, 432);
      ctx.fillStyle = "#1478ff";
      ctx.fillRect(86, 484, 940, 26);
      ctx.fillStyle = "#25bde8";
      ctx.fillRect(86, 548, 720, 26);
      ctx.fillStyle = "#38ad6a";
      ctx.fillRect(86, 612, 1040, 26);
    });
  }

  function enhanceImageCompressor() {
    const input = byId("image-input");
    const drop = document.querySelector("label[for='image-input']");
    const results = byId("image-results");
    if (!input || !drop || !results) return;
    wireDrop(drop, input);
    addToolButton(drop, "Try sample image", async () => {
      setStatus("Loading a sample image...");
      setInputFiles(input, [await sampleProductImage()]);
    });
    input.addEventListener("change", async () => {
      const files = Array.from(input.files || []);
      if (!files.length) return;
      const previews = await Promise.all(files.slice(0, 4).map(async (file) => ({
        name: file.name,
        size: file.size,
        url: await readAsDataUrl(file)
      })));
      results.innerHTML = `
        <div class="preview-header">
          <div><h2>Selected images</h2><p>Compress them to create smaller downloadable outputs.</p></div>
          <span class="preview-badge">${files.length} loaded</span>
        </div>
        <div class="thumb-grid">
          ${previews.map((item) => `
            <article class="mini-preview">
              <img src="${item.url}" alt="${escapeHtml(item.name)} preview">
              <span>${escapeHtml(item.name)}</span>
              <strong>${formatBytes(item.size)}</strong>
            </article>
          `).join("")}
        </div>
      `;
      setStatus("Real images loaded. Choose output settings and compress.");
    });
  }

  function enhanceQrStudio() {
    const holder = byId("qr-holder");
    const generate = byId("qr-generate");
    if (!holder || !generate) return;
    let timer = null;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => generate.click(), 180);
    };
    const wireFields = () => {
      document.querySelectorAll("#qr-fields input, #qr-fields textarea, #qr-size, #qr-dark, #qr-light").forEach((field) => {
        if (!field.dataset.liveQr) {
          field.dataset.liveQr = "true";
          field.addEventListener("input", refresh);
          field.addEventListener("change", refresh);
        }
      });
    };
    const type = byId("qr-type");
    type?.addEventListener("change", async () => {
      await wait();
      wireFields();
      refresh();
    });
    const observer = new MutationObserver(wireFields);
    observer.observe(byId("qr-fields"), { childList: true, subtree: true });
    wireFields();
    wait(120).then(() => {
      generate.click();
      setStatus("Live QR preview is active. Edit any field to update it.", "good");
    });
  }

  function enhancePdfTools() {
    const input = byId("pdf-input");
    const drop = document.querySelector("label[for='pdf-input']");
    const process = byId("pdf-process");
    if (!input || !drop || !process) return;
    wireDrop(drop, input);
    addToolButton(drop, "Try sample PDF", async () => {
      if (!window.PDFLib) {
        setStatus("PDF engine is still loading. Try again in a moment.", "warn");
        return;
      }
      const pdf = await PDFLib.PDFDocument.create();
      const font = await pdf.embedFont(PDFLib.StandardFonts.HelveticaBold);
      const bodyFont = await pdf.embedFont(PDFLib.StandardFonts.Helvetica);
      for (let i = 1; i <= 3; i += 1) {
        const page = pdf.addPage([612, 792]);
        page.drawText(`Online Converters sample page ${i}`, { x: 64, y: 708, size: 26, font });
        page.drawText("This PDF was generated in the browser to test merge, split, optimize, and render.", { x: 64, y: 654, size: 13, font: bodyFont });
        page.drawRectangle({ x: 64, y: 500 - i * 16, width: 320 + i * 40, height: 42, color: PDFLib.rgb(.08, .47, 1) });
        page.drawRectangle({ x: 64, y: 430 - i * 12, width: 220 + i * 60, height: 42, color: PDFLib.rgb(.15, .74, .91) });
      }
      const bytes = await pdf.save({ useObjectStreams: true });
      setInputFiles(input, [new File([bytes], "sample-online-converters.pdf", { type: "application/pdf" })]);
      await wait(80);
      process.click();
    });
  }

  function enhanceScreenshotBeautifier() {
    const input = byId("shot-input");
    const drop = document.querySelector("label[for='shot-input']");
    if (!input || !drop) return;
    wireDrop(drop, input);
    addToolButton(drop, "Try sample screenshot", async () => {
      setStatus("Loading a sample screenshot...");
      setInputFiles(input, [await sampleScreenshot()]);
    });
    document.querySelectorAll("#shot-padding,#shot-radius,#shot-shadow").forEach((slider) => {
      if (slider.dataset.valueReady) return;
      slider.dataset.valueReady = "true";
      const label = document.querySelector(`label[for="${slider.id}"]`);
      const pill = document.createElement("span");
      pill.className = "value-pill";
      label?.append(" ", pill);
      const sync = () => { pill.textContent = slider.value; };
      slider.addEventListener("input", sync);
      sync();
    });
  }

  function enhanceVideoConverter() {
    const input = byId("video-input");
    const drop = document.querySelector("label[for='video-input']");
    if (!input || !drop) return;
    wireDrop(drop, input);
    addToolButton(drop, "Try test video", async (event) => {
      const button = event.currentTarget;
      if (!window.MediaRecorder) {
        setStatus("This browser cannot generate a test video.", "warn");
        return;
      }
      button.disabled = true;
      setStatus("Generating a short test video...");
      try {
        setInputFiles(input, [await sampleVideoFile()]);
        setStatus("Test video loaded. Compress, extract audio, or export a poster.");
      } catch (error) {
        setStatus(error.message || "Could not generate a test video.", "warn");
      } finally {
        button.disabled = false;
      }
    });
  }

  async function sampleVideoFile() {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext("2d");
    const stream = canvas.captureStream(24);
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
    const chunks = [];
    const recorder = new MediaRecorder(stream, { mimeType });
    recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data);
    const stopped = new Promise((resolve) => { recorder.onstop = resolve; });
    recorder.start(100);
    for (let frame = 0; frame < 48; frame += 1) {
      const t = frame / 47;
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#1478ff");
      gradient.addColorStop(1, "#25bde8");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(255,255,255,.92)";
      ctx.beginPath();
      ctx.arc(160 + t * 320, 180, 58, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#111111";
      ctx.font = "700 28px Arial";
      ctx.fillText("Browser video test", 190, 190);
      await wait(1000 / 24);
    }
    recorder.stop();
    await stopped;
    stream.getTracks().forEach((track) => track.stop());
    return new File([new Blob(chunks, { type: "video/webm" })], "sample-video.webm", { type: "video/webm" });
  }

  ({
    "image-compressor": enhanceImageCompressor,
    "qr-studio": enhanceQrStudio,
    "pdf-tools": enhancePdfTools,
    "screenshot-beautifier": enhanceScreenshotBeautifier,
    "video-converter": enhanceVideoConverter
  })[key]?.();
})();
