import React, { useRef, useState } from "react";
import { Facebook, Instagram, CloudDownload } from "lucide-react";

const BRAND_COLOR = "#37BAC2";
const RATIOS = [
  { key: "1:1", label: "1:1", w: 2048, h: 2048 },
  { key: "4:5", label: "4:5", w: 1638, h: 2048 },
  { key: "9:16", label: "9:16", w: 1152, h: 2048 },
];

// Helper: get dominant color
function getDominantColor(img) {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const { data } = ctx.getImageData(0, 0, img.width, img.height);
  let r = 0, g = 0, b = 0, count = 0;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
  }
  return `rgb(${Math.round(r / count)},${Math.round(g / count)},${Math.round(b / count)})`;
}

function App() {
  const [imgUrl, setImgUrl] = useState("");
  const [imgFileName, setImgFileName] = useState("");
  const [mainColor, setMainColor] = useState(BRAND_COLOR);
  const [selectedRatio, setSelectedRatio] = useState(RATIOS[0]);
  const [canvasUrl, setCanvasUrl] = useState("");
  const [copyMsg, setCopyMsg] = useState("");
  const [pasteLoading, setPasteLoading] = useState(false);
  const imgRef = useRef();

  // Handle file upload
  const handleImage = (e) => {
    setCopyMsg("");
    const file = e.target.files[0];
    if (!file) return;
    setImgFileName(file.name);
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    const img = new window.Image();
    img.src = url;
    img.onload = () => setMainColor(getDominantColor(img));
  };

  // Handle paste from clipboard
  const handlePasteClipboard = async () => {
    setPasteLoading(true);
    setCopyMsg("");
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith("image/")) {
            const blob = await item.getType(type);
            const url = URL.createObjectURL(blob);
            setImgUrl(url);
            setImgFileName("clipboard-image.png");
            const img = new window.Image();
            img.src = url;
            img.onload = () => setMainColor(getDominantColor(img));
            setPasteLoading(false);
            return;
          }
        }
      }
      setCopyMsg("No image in clipboard.");
    } catch {
      setCopyMsg("Clipboard image not supported.");
    }
    setPasteLoading(false);
  };

  // Render export canvas with watermark
  const renderCanvas = () => {
    if (!imgUrl) return;
    const { w, h, key } = selectedRatio;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");

    // Gradient: brand color + main color (cover) left->right
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, BRAND_COLOR);
    grad.addColorStop(1, mainColor || "#fff");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Draw book cover (dynamic size per ratio)
    const img = imgRef.current;
    if (img) {
      const aspect = img.naturalWidth / img.naturalHeight;
      // Book cover width rule per ratio:
      let coverW;
      if (key === "9:16") {
        coverW = w * 0.5;
      } else {
        coverW = w / 3;
      }
      let coverH = coverW / aspect;
      // If height exceeds 90% canvas, scale down
      if (coverH > h * 0.9) {
        coverH = h * 0.9;
        coverW = coverH * aspect;
      }
      const x = (w - coverW) / 2;
      // Place cover at vertical center minus some offset (to fit watermark)
      const y = (h - coverH) / 2 - 0.04 * h;
      ctx.save();
      ctx.shadowColor = "rgba(55,186,194,0.08)";
      ctx.shadowBlur = 28;
      ctx.drawImage(img, x, y, coverW, coverH);
      ctx.restore();

      // Watermark under the book cover, right-aligned
      ctx.save();
      const fontSize = Math.round(h * 0.045);
      ctx.font = `bold ${fontSize}px Inter, Arial, sans-serif`;
      ctx.textBaseline = "top";
      ctx.textAlign = "right";
      ctx.globalAlpha = 0.82;
      ctx.fillStyle = "#fff";
      const markY = y + coverH + fontSize * 0.22;
      ctx.fillText("@tinoreading", x + coverW, markY);
      ctx.restore();
    }

    // Convert to JPG
    setCanvasUrl(canvas.toDataURL("image/jpeg", 1.0));
  };

  React.useEffect(() => {
    if (imgUrl) renderCanvas();
    // eslint-disable-next-line
  }, [imgUrl, mainColor, selectedRatio]);

  // Copy JPG to clipboard
  const handleCopy = async () => {
    if (!canvasUrl) return;
    try {
      const res = await fetch(canvasUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new window.ClipboardItem({ [blob.type]: blob }),
      ]);
      setCopyMsg("Copied image!");
      setTimeout(() => setCopyMsg(""), 1200);
    } catch {
      setCopyMsg("Copy failed.");
      setTimeout(() => setCopyMsg(""), 1500);
    }
  };

  return (
    <div>
      {/* HEADER */}
      <header className="header-bar">
        <div className="brand">@tinoreading</div>
        <div className="header-actions">
          <a className="shop-btn" href="https://tinoreading.club/" target="_blank" rel="noopener noreferrer">
            Shop English Books
          </a>
          <a href="https://facebook.com/tinoreading" target="_blank" rel="noopener noreferrer" className="icon-link">
            <Facebook size={22} />
          </a>
          <a href="https://instagram.com/tinoreading" target="_blank" rel="noopener noreferrer" className="icon-link">
            <Instagram size={22} />
          </a>
        </div>
      </header>

      <div className="main-layout">
        {/* LEFT COLUMN */}
        <section className="column left-column">
          <div className="upload-panel">
            <button
              className="clipboard-btn"
              onClick={handlePasteClipboard}
              disabled={pasteLoading}
            >
              {pasteLoading ?
                <span className="btn-spinner">⏳</span> :
                <span className="btn-icon">
                  <svg width="21" height="21" fill="none" stroke="#2ea9b6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
                </span>
              }
              <span>Paste from clipboard</span>
            </button>
            <label htmlFor="upload-image" className="upload-btn">
              <span className="btn-icon">
                <svg width="22" height="22" fill="none" stroke="#2ea9b6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
              </span>
              <span>Upload image</span>
              <input id="upload-image" type="file" accept="image/*" onChange={handleImage} style={{ display: "none" }} />
            </label>
            {/* Filename under upload */}
            {imgFileName &&
              <div className="filename-text">{imgFileName}</div>
            }
          </div>
        </section>

        {/* RIGHT COLUMN */}
        <section className="column right-column">
          <div className="result-panel">
            {/* Export preview area */}
            <div className="export-canvas">
              {canvasUrl ?
                <img
                  src={canvasUrl}
                  alt="result"
                  className="canvas-img"
                  crossOrigin="anonymous"
                /> :
                <span className="preview-placeholder">
                  Export preview
                </span>
              }
              {/* The hidden img for rendering */}
              <img
                ref={imgRef}
                src={imgUrl}
                alt=""
                className="hidden-img"
                crossOrigin="anonymous"
                onLoad={renderCanvas}
              />
            </div>

            {/* Ratio buttons */}
            <div className="ratio-btns">
              {RATIOS.map(ratio => (
                <button
                  key={ratio.key}
                  className={
                    "ratio-btn" + (selectedRatio.key === ratio.key ? " selected" : "")
                  }
                  onClick={() => setSelectedRatio(ratio)}
                >
                  {ratio.label}
                </button>
              ))}
            </div>

            {/* Copy/Download buttons */}
            <div className="export-actions">
              <button
                className="copy-btn"
                onClick={handleCopy}
                title="Copy image"
              >
                Copy
              </button>
              {canvasUrl &&
                <a href={canvasUrl} download="bookcover-export.jpg" className="download-link">
                  <button className="download-btn" title="Download image">
                    <CloudDownload size={22} />
                  </button>
                </a>
              }
            </div>
            {/* Copy message */}
            <div className="copy-msg">
              {copyMsg}
            </div>
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <footer className="footer">
        This web app is designed by Tino Bookstore.
      </footer>

      {/* ALL CSS HERE */}
      <style>{`
        body { margin: 0; padding: 0; }
        .header-bar {
          background: ${BRAND_COLOR};
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 62px;
          padding: 0 46px 0 36px;
        }
        .brand { font-weight: 700; font-size: 20px; letter-spacing: 0.6px; }
        .header-actions { display: flex; align-items: center; gap: 20px; }
        .shop-btn {
          background: #fff;
          border-radius: 20px;
          font-weight: 700;
          color: ${BRAND_COLOR};
          padding: 8px 22px;
          font-size: 16px;
          text-decoration: none;
          margin-right: 6px;
          box-shadow: 0 2px 8px #abe9fa22;
          border: none;
        }
        .icon-link svg { color: #fff !important; }

        .main-layout {
          display: flex;
          height: calc(100vh - 62px);
          min-height: 400px;
          background: #F8FAFB;
        }
        .column {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          background: #fff;
        }
        .left-column { width: 25%; min-width: 340px; }
        .right-column { width: 75%; }

        .upload-panel {
          width: 310px;
          min-height: 292px;
          border-radius: 36px;
          box-shadow: 0 4px 26px #abe9fa18;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 38px 22px 32px 22px;
          background: #fff;
        }
        .clipboard-btn, .upload-btn {
          width: 205px;
          height: 46px;
          border-radius: 18px;
          font-weight: 600;
          font-size: 17px;
          margin-bottom: 13px;
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1.7px solid #d8e5eb;
          background: #f7fafd;
          color: #2ea9b6;
          cursor: pointer;
          justify-content: center;
          transition: background 0.15s;
        }
        .clipboard-btn:disabled { cursor: wait; opacity: 0.72; }
        .btn-spinner { font-size: 18px; }
        .btn-icon { display: flex; align-items: center; }
        .filename-text {
          font-size: 14.5px;
          margin-top: 2px;
          color: #93a3ad;
          font-weight: 500;
          text-align: center;
        }

        .result-panel {
          width: 420px;
          min-height: 500px;
          background: #fff;
          border-radius: 36px;
          box-shadow: 0 4px 26px #abe9fa18;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 38px 28px 28px 28px;
        }
        .export-canvas {
          width: 272px;
          height: 272px;
          border-radius: 27px;
          box-shadow: 0 1.5px 12px #54cfe915;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          background: #fff;
        }
        .canvas-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 27px;
          background: #fff;
        }
        .hidden-img { display: none; }
        .preview-placeholder {
          color: #b9babd;
          font-size: 19px;
          font-weight: 500;
        }

        .ratio-btns {
          margin-top: 28px;
          width: 100%;
          display: flex;
          justify-content: center;
          gap: 14px;
        }
        .ratio-btn {
          padding: 8px 28px;
          background: #f2fafd;
          color: #41b7c2;
          border: none;
          border-radius: 16px;
          font-weight: 700;
          font-size: 17px;
          cursor: pointer;
          outline: none;
          letter-spacing: 0.2px;
          transition: background 0.18s, color 0.18s;
        }
        .ratio-btn.selected {
          background: ${BRAND_COLOR};
          color: #fff;
          box-shadow: 0 1.5px 6px #37bac229;
        }

        .export-actions {
          margin-top: 18px;
          display: flex;
          justify-content: flex-end;
          width: 100%;
          gap: 11px;
        }
        .copy-btn {
          background: ${BRAND_COLOR};
          color: #fff;
          border: none;
          border-radius: 16px;
          padding: 10px 28px;
          font-weight: 700;
          font-size: 16.5px;
          letter-spacing: 0.15px;
          display: flex;
          align-items: center;
          cursor: pointer;
        }
        .download-link { text-decoration: none; }
        .download-btn {
          background: #f7fafd;
          color: ${BRAND_COLOR};
          border: 1.5px solid #dbeaea;
          border-radius: 16px;
          padding: 10px 13px;
          font-weight: 700;
          font-size: 16px;
          display: flex;
          align-items: center;
          cursor: pointer;
        }
        .copy-msg {
          min-height: 22px;
          font-size: 15px;
          color: #21b174;
          font-weight: 500;
          text-align: center;
          margin-top: 3px;
        }

        .footer {
          font-size: 15px;
          color: #8ea8ad;
          padding: 17px 0 13px 48px;
          font-weight: 600;
          letter-spacing: 0.1px;
          user-select: none;
        }
      `}</style>
    </div>
  );
}

export default App;
