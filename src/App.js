// src/App.js
import React, { useRef, useState } from "react";
import { Download, Clipboard, Upload, Instagram, Facebook } from "lucide-react";
import logo from "./assets/logo.png";

// Ratio configs
const RATIOS = [
  { label: "1:1", w: 2048, h: 2048 },
  { label: "4:5", w: 1638, h: 2048 },
  { label: "9:16", w: 1152, h: 2048 }
];

function getTodayString() {
  const d = new Date();
  const m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return m[d.getMonth()] + d.getDate();
}

function App() {
  const [imgUrl, setImgUrl] = useState(null);
  const [fileName, setFileName] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const fileInput = useRef();

  // Handle image upload/paste
  function onUpload(e, pastedFile) {
    const file = pastedFile || e.target.files[0];
    if (!file) return;
    setFileName(file.name.match(/clipboard/i) ? "" : file.name); // Hide clipboard-image.png
    const reader = new FileReader();
    reader.onload = (ev) => setImgUrl(ev.target.result);
    reader.readAsDataURL(file);
  }
  function onPaste(e) {
    const items = e.clipboardData.items;
    for (let item of items) {
      if (item.type.indexOf("image") === 0) {
        onUpload(null, item.getAsFile());
        return;
      }
    }
  }

  // Canvas logic
  function renderCanvasUrl() {
    if (!imgUrl) return "";
    const { w, h } = RATIOS[selectedIdx];
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");

    // Gradient background (brand + dominant color as fallback)
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#37bac2");
    grad.addColorStop(1, "#d98c49"); // fallback: orange
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);

    // Book cover sizing
    let coverW = w / (selectedIdx === 2 ? 3 : 3); // 1/3 for all, including 9:16 as requested
    let coverH = coverW;
    let ratioImg = new window.Image();
    ratioImg.src = imgUrl;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.10)";
    ctx.shadowBlur = 32;
    ctx.shadowOffsetY = 14;
    // Position in center
    const x = (w - coverW) / 2;
    const y = (h - coverH) / 2 - 24;
    ctx.drawImage(ratioImg, x, y, coverW, coverH);
    ctx.restore();

    // Watermark under book cover (2/3 width of book cover)
    ctx.globalAlpha = 0.4;
    ctx.font = `bold ${Math.floor(coverW * 2 / 3 * 0.18)}px Inter,sans-serif`;
    ctx.fillStyle = "#fff";
    ctx.textAlign = "right";
    ctx.fillText(
      "@tinoreading",
      x + coverW,
      y + coverH + 8 + Math.floor(coverW * 2 / 3 * 0.18)
    );
    ctx.globalAlpha = 1;

    return canvas.toDataURL("image/jpeg", 1.0);
  }
  const exportUrl = imgUrl ? renderCanvasUrl() : "";

  // Download
  function handleDownload() {
    if (!exportUrl) return;
    const name = `TINOReading_YourSocialBook_${getTodayString()}.jpg`;
    const a = document.createElement("a");
    a.href = exportUrl;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  // Copy
  async function handleCopy() {
    if (!exportUrl) return;
    const blob = await (await fetch(exportUrl)).blob();
    await navigator.clipboard.write([
      new window.ClipboardItem({ "image/jpeg": blob })
    ]);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="main-app" onPaste={onPaste}>
      {/* Header */}
      <header className="header">
        <img src={logo} alt="TINOReading" className="header-logo" />
        <div className="header-actions">
          <a className="header-btn" href="https://tinoread.ing/" target="_blank" rel="noopener noreferrer">
            Shop English Books
          </a>
          <a href="https://facebook.com/tinoreading" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
            <Facebook strokeWidth={2} size={28} />
          </a>
          <a href="https://instagram.com/tinoreading" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <Instagram strokeWidth={2} size={28} />
          </a>
        </div>
      </header>

      <main className="centerbox">
        {/* Controls */}
        <div className="upload-row">
          <button
            className="upload-btn"
            onClick={() => fileInput.current.click()}
          >
            <Upload size={18} style={{marginRight:8}}/> Upload image
          </button>
          <input
            type="file"
            accept="image/*"
            style={{display:"none"}}
            ref={fileInput}
            onChange={onUpload}
          />
          <button className="upload-btn" onClick={() => navigator.clipboard.read().then(()=>{})}>
            <Clipboard size={18} style={{marginRight:8}}/> Paste from clipboard
          </button>
        </div>
        {!!fileName && (
          <div className="filename">{fileName}</div>
        )}

        {/* Ratio selector */}
        <div className="ratio-slider">
          {RATIOS.map((r, idx) => (
            <button
              key={r.label}
              className={`ratio-btn${selectedIdx===idx?" selected":""}`}
              onClick={()=>setSelectedIdx(idx)}
            >{r.label}</button>
          ))}
        </div>

        {/* Rendered Canvas */}
        <div className="export-canvasbox">
          {imgUrl ? (
            <img
              src={exportUrl}
              className="export-canvas"
              style={{width:"350px",height:"auto"}}
              alt="export preview"
            />
          ) : (
            <div className="canvas-placeholder">Preview will appear here</div>
          )}
        </div>

        {/* Actions */}
        <div className="export-row">
          <button className="export-btn" onClick={handleCopy}>{copied ? "Copied!" : "Copy"}</button>
          <button className="export-btn" onClick={handleDownload}><Download size={18} style={{marginRight:8}}/>Download</button>
        </div>

        {/* Disclaimer */}
        <div className="disclaimer">
          This web app is designed by Tino Bookstore. No image data is uploaded or stored; all processing happens locally in your browser.
        </div>
      </main>
      {/* Style */}
      <style>{`
      body { margin:0; background:#fff; font-family:Inter,Helvetica,Arial,sans-serif;}
      .main-app { min-height:100vh; background:#fff;}
      .header {
        width:100vw; height:64px; background:#37bac2; color:#fff; display:flex; align-items:center; justify-content:center; gap:24px;
      }
      .header-logo { height:38px; margin-right:auto; margin-left:24px;}
      .header-actions { display:flex; gap:14px; align-items:center;}
      .header-btn { background:#fff; color:#37bac2; border:none; border-radius:20px; font-weight:600; padding:9px 22px; font-size:16px; cursor:pointer; transition:.2s;}
      .header-btn:hover { background:#e7fbfd;}
      .centerbox {
        width:100%; max-width:650px; margin:0 auto;
        display:flex; flex-direction:column; align-items:center; justify-content:center;
        min-height:calc(100vh - 64px); padding:0 20px 20px 20px; box-sizing:border-box;
      }
      .upload-row { display:flex; gap:18px; width:100%; margin:48px 0 0 0; justify-content:center;}
      .upload-btn {
        display:flex; align-items:center; background:#e7fbfd; color:#37bac2; border:2px dashed #37bac2; border-radius:18px;
        padding:13px 26px; font-size:16px; font-weight:500; cursor:pointer; transition:.18s;
      }
      .upload-btn:hover { background:#bff0fa;}
      .filename { margin-top:9px; color:#888; font-size:15px; text-align:center;}
      .ratio-slider { display:flex; gap:9px; margin:30px 0 12px 0;}
      .ratio-btn {
        padding:8px 26px; background:#fff; border:1.8px solid #bfe9ee; border-radius:16px;
        font-weight:600; color:#37bac2; font-size:16px; cursor:pointer; transition:.14s;
      }
      .ratio-btn.selected, .ratio-btn:hover { background:#37bac2; color:#fff; border-color:#37bac2; }
      .export-canvasbox { width:100%; display:flex; justify-content:center; align-items:center; margin:0 0 12px 0;}
      .export-canvas {
        box-shadow: 0 12px 28px 0 rgba(0,0,0,0.10), 0 1.5px 12px 0 rgba(0,0,0,0.07);
        border-radius:0; display:block;
        background:#fff;
        transition: box-shadow 0.3s;
      }
      .canvas-placeholder {
        width:350px; height:350px; display:flex; align-items:center; justify-content:center; background:#f2f2f2;
        color:#bbb; font-size:20px; border-radius:0; font-weight:500;
      }
      .export-row { display:flex; gap:14px; margin:20px 0 0 0;}
      .export-btn {
        background:#37bac2; color:#fff; font-weight:600; font-size:17px; padding:12px 32px; border:none;
        border-radius:16px; cursor:pointer; display:flex; align-items:center; transition:.16s;
      }
      .export-btn:hover { background:#25a1aa;}
      .disclaimer { margin:38px auto 0 auto; color:#bbb; font-size:15px; text-align:center;}
      @media (max-width:700px) {
        .centerbox { max-width:100vw; padding:0 12px;}
        .export-canvasbox, .canvas-placeholder { width:100%;}
        .export-canvas, .canvas-placeholder { max-width:98vw; height:auto;}
        .upload-row { flex-direction:column; gap:13px;}
        .header-logo { margin-left:7px;}
      }
      `}
      </style>
    </div>
  );
}
export default App;