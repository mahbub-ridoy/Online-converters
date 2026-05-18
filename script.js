const tools = {
  image: {
    accent: "#12b3a8",
    mode: "Image Compressor",
    action: "Batch image upload",
    before: "14.8 MB",
    after: "3.1 MB",
    labels: ["Quality", "Size saved", "Export ready"],
    values: ["82%", "71%", "94%"],
    exports: ["compressed-images.zip", "preview-report.pdf", "settings.json"],
  },
  pdf: {
    accent: "#ff6b5f",
    mode: "PDF Tools App",
    action: "Merge, split, or compress PDFs",
    before: "46 pages",
    after: "12.4 MB",
    labels: ["Page range", "Compression", "OCR queue"],
    values: ["68%", "76%", "42%"],
    exports: ["merged-document.pdf", "pages-8-14.zip", "pdf-images.zip"],
  },
  background: {
    accent: "#8067dc",
    mode: "Background Remover",
    action: "Clean product or profile photos",
    before: "Original JPG",
    after: "Transparent PNG",
    labels: ["Edge cleanup", "Backdrop fill", "Shop crop"],
    values: ["88%", "62%", "80%"],
    exports: ["transparent-product.png", "white-bg-export.jpg", "avatar-square.png"],
  },
  video: {
    accent: "#4b7bec",
    mode: "Video Compressor",
    action: "Convert, resize, extract, or GIF",
    before: "318 MB",
    after: "54 MB",
    labels: ["Bitrate", "Resolution", "Audio extract"],
    values: ["64%", "72%", "56%"],
    exports: ["launch-demo.mp4", "launch-demo.webm", "audio-track.m4a"],
  },
  qr: {
    accent: "#f5b84b",
    mode: "QR Code Studio",
    action: "Generate branded QR codes",
    before: "Plain URL",
    after: "Styled QR",
    labels: ["Contrast", "Logo space", "Print ready"],
    values: ["91%", "52%", "86%"],
    exports: ["qr-code.svg", "qr-code.png", "print-sheet.pdf"],
  },
  resume: {
    accent: "#48b96f",
    mode: "Resume Builder",
    action: "Build templates with live preview",
    before: "Draft text",
    after: "PDF resume",
    labels: ["ATS clarity", "Template fit", "PDF export"],
    values: ["84%", "73%", "93%"],
    exports: ["resume-modern.pdf", "resume-source.json", "cover-letter.pdf"],
  },
  screenshot: {
    accent: "#ff8a3d",
    mode: "Screenshot Beautifier",
    action: "Frame screenshots for social posts",
    before: "Raw capture",
    after: "Polished PNG",
    labels: ["Frame fit", "Shadow depth", "Social crop"],
    values: ["79%", "66%", "89%"],
    exports: ["product-shot.png", "social-square.png", "wide-banner.png"],
  },
};

const cards = document.querySelectorAll(".tool-card");
const preview = document.querySelector(".tool-preview");
const previewMode = document.querySelector("#preview-mode");
const previewAction = document.querySelector("#preview-action");
const previewBefore = document.querySelector("#preview-before");
const previewAfter = document.querySelector("#preview-after");
const meterLabels = [
  document.querySelector("#meter-label-one"),
  document.querySelector("#meter-label-two"),
  document.querySelector("#meter-label-three"),
];
const meters = document.querySelectorAll(".meter-row i");
const exportItems = [
  document.querySelector("#export-one"),
  document.querySelector("#export-two"),
  document.querySelector("#export-three"),
];

function activateTool(key) {
  const tool = tools[key];

  if (!tool) {
    return;
  }

  cards.forEach((card) => {
    card.classList.toggle("is-active", card.dataset.tool === key);
  });

  preview.style.setProperty("--active", tool.accent);
  previewMode.textContent = tool.mode;
  previewAction.textContent = tool.action;
  previewBefore.textContent = tool.before;
  previewAfter.textContent = tool.after;

  tool.labels.forEach((label, index) => {
    meterLabels[index].textContent = label;
  });

  tool.values.forEach((value, index) => {
    meters[index].style.setProperty("--value", value);
  });

  tool.exports.forEach((item, index) => {
    exportItems[index].textContent = item;
  });
}

cards.forEach((card) => {
  card.addEventListener("click", () => activateTool(card.dataset.tool));
});

activateTool("image");
