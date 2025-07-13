import React, { useRef, useState, useEffect } from "react";
import logo from './assets/logo.png';
import { Facebook, Instagram, CloudDownload, ShoppingBag } from "lucide-react";

const BRAND_COLOR = "#37BAC2";
const RATIOS = [
  { key: "1:1", label: "1:1", w: 2048, h: 2048 },
  { key: "4:5", label: "4:5", w: 1638, h: 2048 },
  { key: "9:16", label: "9:16", w: 1152, h: 2048 },
];

// --- Constants for easy tweak ---
const EXPORT_CANVAS_SIZE = 340; // px, desktop default (was 290)
const EXPORT_CANVAS_SIZE_MOBILE = 300; // px, mobile max

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

export default function App() {
  const [imgUrl, setImgUrl] = useState("");
  const [imgFileName, setImgFileName] = useState("");
  const [mainColor, setMainColor] = useState(BRAND_COLOR);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [canvasUrl, setCanvasUrl] = useState("");
  const [copyMsg, setCopyMsg] = useState("");
  const [pasteLoading, setPasteLoading] = useState(false);
  const imgRef = useRef();
  const [canvasBoxHeight, setCanvasBoxHeight] = useState(EXPORT_CANVAS_SIZE);

  // Adjust height for viewport, so all fits, with larger export canvas
  useEffect(() => {
    function adjustHeight() {
      const headerH = 62;
      const actionsH = 48;
      const ratioH = 54;
      const exportH = 54;
      const msgH = copyMsg ? 22 : 0;
      const disclaimerH = 34;
      const gapSum = 24 + 16 + 20; // less margin/padding between blocks
      const fileH = imgFileName && imgFileName !== "clipboard-image.png" ? 23 : 0;
      let max = window.innerHeight - headerH - actionsH - fileH - ratioH - exportH - msgH - disclaimerH - gapSum;
      setCanvasBoxHeight(Math.max(180, Math.min(EXPORT_CANVAS_SIZE, max)));
    }
    adjustHeight();
    window.addEventListener("resize", adjustHeight);
    return () => window.removeEventListener("resize", adjustHeight);
    // eslint-disable-next-line
  }, [imgFileName, copyMsg]);

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
            setImgFileName(""); // <--- Don't show clipboard-image.png
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

  // --- Canvas Render Logic ---
  const renderCanvas = () => {
    if (!imgUrl) return;
    const { w, h } = RATIOS[selectedIdx];
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, BRAND_COLOR);
    grad.addColorStop(1, mainColor || "#fff");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const img = imgRef.current;
    if (img) {
      const aspect = img.naturalWidth / img.naturalHeight;
      let coverW;
      // In ALL ratios, book cover is 1/3 of width (per latest request)
      coverW = w / 3;
      let coverH = coverW / aspect;
      if (coverH > h * 0.9) {
        coverH = h * 0.9;
        coverW = coverH * aspect;
      }
      const x = (w - coverW) / 2;
      const y = (h - coverH) / 2 - 0.04 * h;

      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.18)";
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 4;

      // Clip to a rounded rectangle
      const r = 5; // px radius
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + coverW - r, y);
      ctx.quadraticCurveTo(x + coverW, y, x + coverW, y + r);
      ctx.lineTo(x + coverW, y + coverH - r);
      ctx.quadraticCurveTo(x + coverW, y + coverH, x + coverW - r, y + coverH);
      ctx.lineTo(x + r, y + coverH);
      ctx.quadraticCurveTo(x, y + coverH, x, y + coverH - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(img, x, y, coverW, coverH);
      ctx.restore();

      // Watermark: always 2/3 of book cover width, 40% opacity, 5px margin top
      ctx.save();
      const watermarkW = coverW * (2 / 3);
      let fontSize = watermarkW / 8;
      fontSize = Math.max(16, Math.min(fontSize, 48));
      ctx.font = `bold ${fontSize}px Inter, Arial, sans-serif`;
      ctx.textBaseline = "top";
      ctx.textAlign = "right";
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = "#fff";
      const markY = y + coverH + 8;
      ctx.fillText("@tinoreading", x + coverW, markY, watermarkW);
      ctx.restore();
    }
    setCanvasUrl(canvas.toDataURL("image/jpeg", 1.0));
  };

  useEffect(() => {
    if (imgUrl) renderCanvas();
    // eslint-disable-next-line
  }, [imgUrl, mainColor, selectedIdx]);

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

  const sliderWidth = 260;
  const highlightW = Math.floor(sliderWidth / 3) - 6;

  return (
    <div>
      <header className="header-bar">
        <img src={logo} alt="Tino Reading Logo" className="logo-img" />
        <div className="header-actions">
        <a className="shop-btn" href="https://tinoread.ing/" target="_blank" rel="noopener noreferrer">
          <span className="shop-btn-text">Shop English Books</span>
          <span className="shop-btn-icon"><ShoppingBag size={22} /></span>
        </a>

          <a href="https://facebook.com/tinoreading" target="_blank" rel="noopener noreferrer" className="icon-link">
            <Facebook size={22} />
          </a>
          <a href="https://instagram.com/tinoreading" target="_blank" rel="noopener noreferrer" className="icon-link">
            <Instagram size={22} />
          </a>
        </div>
      </header>
      <div className="center-container">
        <div className="actions-row">
          <button
            className="clipboard-btn"
            onClick={handlePasteClipboard}
            disabled={pasteLoading}
          >
            {pasteLoading ?
              <span className="btn-spinner">⏳</span> :
              <span className="btn-icon">
                <svg width="19" height="19" fill="none" stroke="#2ea9b6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
              </span>
            }
            <span class="">Paste clipboard</span>
          </button>
          <label htmlFor="upload-image" className="upload-btn">
            <span className="btn-icon">
              <svg width="19" height="19" fill="none" stroke="#2ea9b6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
            </span>
            <span class="btn-title">Upload image</span>
            <input id="upload-image" type="file" accept="image/*" onChange={handleImage} style={{ display: "none" }} />
          </label>
        </div>
        <div className="filename-area">
          {imgFileName && imgFileName !== "clipboard-image.png" && (
            <span className="filename-text">{imgFileName}</span>
          )}
        </div>
        <div
          className="result-panel"
          style={{
            minHeight: canvasBoxHeight,
            maxHeight: canvasBoxHeight,
            transition: "max-height 0.32s cubic-bezier(.7,.4,0,1)",
          }}
        >
          <div
            className="export-canvas sharp-corner"
            style={{
              width: canvasBoxHeight,
              height: canvasBoxHeight,
              maxWidth: "100vw",
              maxHeight: "100vw"
            }}
          >
            {canvasUrl ?
              <img
                src={canvasUrl}
                alt="result"
                className="canvas-img"
                crossOrigin="anonymous"
                style={{ transition: "opacity 0.32s" }}
              /> :
              <span className="preview-placeholder">
                Export preview
              </span>
            }
            <img
              ref={imgRef}
              src={imgUrl}
              alt=""
              className="hidden-img"
              crossOrigin="anonymous"
              onLoad={renderCanvas}
            />
          </div>
        </div>
        <div className="ratio-slider" style={{ width: sliderWidth, marginTop: 16 }}>
          {RATIOS.map((ratio, idx) => (
            <button
              key={ratio.key}
              className={
                "slider-segment" + (selectedIdx === idx ? " selected" : "")
              }
              onClick={() => setSelectedIdx(idx)}
              tabIndex={0}
              style={{ zIndex: selectedIdx === idx ? 2 : 1 }}
            >
              {ratio.label}
            </button>
          ))}
          <div
            className="slider-highlight"
            style={{
              left: `calc(${selectedIdx * 33.3333}% + 3px)`,
              width: highlightW,
              transition: "left 0.32s cubic-bezier(.7,.4,0,1)"
            }}
          />
        </div>
        <div className="export-actions">
          <button
            className="copy-btn"
            onClick={handleCopy}
            title="Copy image"
          >
            Copy
          </button>
          {canvasUrl &&
            <a 
              href={canvasUrl} 
              download={(() => {
                const today = new Date();
                const month = today.toLocaleString('en-US', { month: 'short' });
                const day = today.getDate();
                return `TINOReading_YourSocialBook_${month}${day}.jpg`;
                })()}
              className="download-link"
              >
              <button className="download-btn" title="Download image">
                <CloudDownload size={19} />
              </button>
            </a>
          }
        </div>
        <div className="copy-msg">
          {copyMsg}
        </div>
        <div className="disclaimer">
          This web app processes all images on your device. No image data is uploaded or saved.
        </div>
      </div>
      <style>{`
        html, body {
          background: #fff;
          margin: 0;
          padding: 0;
        }
        .header-bar {
          background: ${BRAND_COLOR};
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 62px;
          padding: 0 46px 0 36px;
          min-width: 0;
        }
        .logo-img {
          height: 36px;
          width: auto;
          display: block;
        }
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
        .shop-btn-icon { display: none; }
        .shop-btn-text { display: inline; }
        @media (max-width: 700px) {
        .shop-btn-text { display: none; }
        .shop-btn-icon { display: inline; }
        .shop-btn {
        min-width: 0;
        background: none;
        color: white;
        padding: 0;
        margin: 0;
        }}
        .icon-link svg { color: #fff !important; }
        .center-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: 0 auto;
          width: 100%;
          max-width: 650px;
          min-height: calc(100vh - 62px);
          box-sizing: border-box;
          padding-left: 0;
          padding-right: 0;
        }
        .actions-row {
          display: flex;
          gap: 16px;
          margin-top: 24px;
          margin-bottom: 0;
          width: 100%;
          justify-content: center;
        }
        .clipboard-btn, .upload-btn {
          width: 170px;
          height: 36px;
          border-radius: 13px;
          font-weight: 500;
          font-size: 13px;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1.5px solid #d8e5eb;
          background: #f7fafd;
          color: #2ea9b6;
          cursor: pointer;
          justify-content: center;
          transition: background 0.15s;
        }
        .clipboard-btn:disabled { cursor: wait; opacity: 0.72; }
        .filename-area { height: 23px; display: flex; align-items: center; justify-content: center; }
        .filename-text {
          font-size: 13.2px;
          color: #93a3ad;
          font-weight: 500;
          text-align: center;
          animation: fadeInFile 0.44s;
        }
        @keyframes fadeInFile { from { opacity:0; transform:translateY(-10px);} to {opacity:1; transform:none;} }
        .result-panel {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 10px;
          margin-bottom: 0;
        }
        .export-canvas {
          background: #fff;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow: 0 1.5px 12px #54cfe915;
          border-radius: 0 !important;
        }
        .sharp-corner { border-radius: 0 !important; }
        .canvas-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 0 !important;
          background: #fff;
        }
        .hidden-img { display: none; }
        .preview-placeholder {
          color: #b9babd;
          font-size: 19px;
          font-weight: 500;
        }
        .ratio-slider {
          position: relative;
          margin-top: 16px;
          width: 260px;
          height: 42px;
          background: #f2fafd;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 2px 10px #c7fcf62d;
        }
        .slider-segment {
          flex: 1 1 33.33%;
          background: none;
          border: none;
          outline: none;
          color: #38b9c2;
          font-weight: 700;
          font-size: 14px;
          padding: 8px 0;
          z-index: 2;
          cursor: pointer;
          position: relative;
          transition: color 0.22s;
        }
        .slider-segment.selected {
          color: #fff;
        }
        .slider-highlight {
          position: absolute;
          top: 3px;
          height: 36px;
          border-radius: 14px;
          background: ${BRAND_COLOR};
          z-index: 1;
          box-shadow: 0 2px 10px #b0f6fe44;
          transition: left 0.38s cubic-bezier(.77,.22,.31,1.08), background 0.19s;
        }
        .export-actions {
          margin-top: 16px;
          display: flex;
          flex-direction: row;
          justify-content: center;
          width: 100%;
          gap: 12px;
        }
        .copy-btn {
          background: ${BRAND_COLOR};
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 8px 26px;
          font-weight: 700;
          font-size: 15px;
          letter-spacing: 0.15px;
          display: flex;
          align-items: center;
          cursor: pointer;
          box-shadow: 0 2px 8px #abe9fa22;
          transition: background 0.2s;
        }
        .download-link { margin-left: 7px; }
        .download-btn {
          background: #fff;
          border-radius: 12px;
          color: ${BRAND_COLOR};
          border: 1.3px solid #c3e8eb;
          padding: 8px 11px 7px 11px;
          font-weight: 700;
          font-size: 15px;
          display: flex;
          align-items: center;
          cursor: pointer;
          box-shadow: 0 2px 8px #abe9fa22;
        }
        .copy-msg {
          text-align: center;
          font-size: 13.5px;
          font-weight: 500;
          color: #29b8b3;
          min-height: 22px;
          margin-top: 6px;
        }
        .disclaimer {
          margin: 28px auto 16px;
          font-size: 13px;
          color: #b6bbc1;
          text-align: center;
        }
        .btn-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 21px;
        }
        .clipboard-btn {
          height:39px!important;
        }
        .btn-title {
        font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif !important;
        }
        @media (max-width: 700px) {
          .center-container {
            max-width: 100vw;
            min-width: 0;
            padding: 0 20px;
            min-height: unset;
          }
          .export-canvas { width: ${EXPORT_CANVAS_SIZE_MOBILE}px !important; height: ${EXPORT_CANVAS_SIZE_MOBILE}px !important; max-width: 99vw; max-height: 99vw;}
          .ratio-slider { width: 96vw; max-width: 270px;}
          .header-bar { padding: 0 5vw 0 4vw; }
        }
      `}</style>
    </div>
  );
}