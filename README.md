# Online Converters

A polished static browser toolkit for everyday file work.

## Tools

- Image Compressor: resize and compress images with before/after preview and ZIP download.
- PDF Tools: merge PDFs, extract page ranges, optimize PDFs, create PDFs from images, and render pages to PNG.
- Background Cleanup: remove simple solid-color backgrounds, recolor, resize, and export PNG.
- Video Compressor: resize browser-supported videos to WebM, extract audio, and export poster frames.
- QR Code Studio: generate URL, Wi-Fi, vCard, and payment QR codes with PNG/SVG export.
- Resume Builder: edit a clean resume preview and export through the browser print dialog.
- Screenshot Beautifier: frame screenshots with backgrounds, padding, corners, shadows, and PNG export.

## Run Locally

This is a static site. Serve the folder from the repo root:

```bash
python3 -m http.server 4173
```

Then visit `http://localhost:4173`.

## Notes

Most tools run fully in the browser. PDF, ZIP, and QR features use proven browser libraries from public CDNs. Video support depends on the browser's `MediaRecorder` and playback capabilities.
