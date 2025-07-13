import React, { useRef, useState } from "react";
import { Facebook, Instagram, CloudDownload } from "lucide-react";

// Helper: Extract dominant color
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

// Ratios: width:height, but height always 2048px, width auto (if needed)
const RATIOS = [
  { key: "1:1", label: "1:1", w: 2048, h: 2048 },
  { key: "4:5", label: "4:5", w: 1638, h: 2048 },
  { key: "9:16", label: "9:16", w: 1152, h: 2048 },
];

const BRAND_COLOR = "#37BAC2";

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
    const { w, h } = selectedRatio;
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

    // Draw book cover (max 75% height of export, centered horizontally)
    const img = imgRef.current;
    if (img) {
      const maxH = h * 0.75;
      const maxW = w * 0.8;
      const aspect = img.naturalWidth / img.naturalHeight;
      let drawH = maxH, drawW = maxH * aspect;
      if (drawW > maxW) { drawW = maxW; drawH = drawW / aspect; }
      const x = (w - drawW) / 2;
      const y = (h - maxH) / 2;
      ctx.save();
      ctx.shadowColor = "rgba(55,186,194,0.07)";
      ctx.shadowBlur = 34;
      ctx.drawImage(img, x, y, drawW, drawH);
      ctx.restore();

      // Watermark: right under book cover, right-aligned
      ctx.save();
      const fontSize = Math.round(h * 0.045);
      ctx.font = `bold ${fontSize}px Inter, Arial, sans-serif`;
      ctx.textBaseline = "top";
      ctx.textAlign = "right";
      ctx.globalAlpha = 0.82;
      ctx.fillStyle = "#fff";
      const markY = y + drawH + fontSize * 0.35;
      ctx.fillText("@tinoreading", x + drawW, markY);
      ctx.restore();
    }

    // Convert to JPG
    setCanvasUrl(canvas.toDataURL("image/jpeg", 1.0));
  };

  // Auto re-render on change
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
    <div style={{ minHeight: "100vh", fontFamily: "Inter, Arial, sans-serif", display: "flex", flexDirection: "column", background: "#F8FAFB" }}>
      {/* HEADER */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 62,
        padding: "0 46px 0 36px",
        background: BRAND_COLOR,
      }}>
        <div style={{ fontWeight: 700, fontSize: 20, color: "#fff", letterSpacing: 0.6 }}>@tinoreading</div>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <a
            href="https://tinoreading.club/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "#fff",
              borderRadius: 20,
              fontWeight: 700,
              color: BRAND_COLOR,
              padding: "8px 22px",
              fontSize: 16,
              textDecoration: "none",
              marginRight: 6,
              boxShadow: "0 2px 8px #abe9fa22"
            }}>
            Shop English Books
          </a>
          <a href="https://facebook.com/tinoreading" target="_blank" rel="noopener noreferrer">
            <Facebook size={22} color="#fff" />
          </a>
          <a href="https://instagram.com/tinoreading" target="_blank" rel="noopener noreferrer">
            <Instagram size={22} color="#fff" />
          </a>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", height: "calc(100vh - 62px)", minHeight: 400 }}>
        {/* LEFT */}
        <div style={{
          flex: "0 0 390px",
          padding: "44px 24px 0 44px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{
            width: 310,
            minHeight: 292,
            background: "#fff",
            borderRadius: 36,
            boxShadow: "0 4px 26px #abe9fa18",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "38px 22px 32px 22px"
          }}>
            {/* Paste from clipboard */}
            <button
              onClick={handlePasteClipboard}
              disabled={pasteLoading}
              style={{
                width: 205,
                height: 46,
                marginBottom: 13,
                background: "#f7fafd",
                border: `1.7px solid #d8e5eb`,
                borderRadius: 18,
                color: "#2ea9b6",
                fontWeight: 600,
                fontSize: 17,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                cursor: pasteLoading ? "wait" : "pointer",
                transition: "background 0.18s"
              }}>
              {pasteLoading ? (
                <span style={{fontSize:18}}>⏳</span>
              ) : (
                <svg width="21" height="21" fill="none" stroke="#2ea9b6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
              )}
              <span>Paste from clipboard</span>
            </button>
            {/* Upload image */}
            <label htmlFor="upload-image" style={{
              width: 205,
              height: 46,
              background: "#f7fafd",
              border: `1.7px solid #d8e5eb`,
              borderRadius: 18,
              color: "#2ea9b6",
              fontWeight: 600,
              fontSize: 17,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              cursor: "pointer",
              marginBottom: 9
            }}>
              <svg width="22" height="22" fill="none" stroke="#2ea9b6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
              <span>Upload image</span>
              <input id="upload-image" type="file" accept="image/*" onChange={handleImage} style={{ display: "none" }} />
            </label>
            {/* Show filename if uploaded */}
            {imgFileName &&
              <div style={{
                fontSize: 14.5,
                marginTop: 2,
                color: "#93a3ad",
                fontWeight: 500,
                textAlign: "center"
              }}>{imgFileName}</div>
            }
          </div>
        </div>
        {/* RIGHT */}
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 40px 0 0"
        }}>
          <div style={{
            width: 420,
            minHeight: 500,
            background: "#fff",
            borderRadius: 36,
            boxShadow: "0 4px 26px #abe9fa18",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "38px 28px 28px 28px"
          }}>
            {/* Export preview area */}
            <div style={{
              width: 272,
              height: 272,
              borderRadius: 27,
              background: "#fff",
              boxShadow: "0 1.5px 12px #54cfe915",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative"
            }}>
              {/* Hide book preview, only show exported */}
              {canvasUrl ?
                <img
                  src={canvasUrl}
                  alt="result"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    borderRadius: 27,
                    background: "#fff"
                  }}
                  crossOrigin="anonymous"
                /> :
                <span style={{
                  color: "#b9babd",
                  fontSize: 19,
                  fontWeight: 500
                }}>
                  Export preview
                </span>
              }
              {/* The hidden img for rendering */}
              <img
                ref={imgRef}
                src={imgUrl}
                alt=""
                style={{ display: "none" }}
                crossOrigin="anonymous"
                onLoad={renderCanvas}
              />
            </div>
            {/* Ratio buttons */}
            <div style={{
              marginTop: 28,
              width: "100%",
              display: "flex",
              justifyContent: "center",
              gap: 14
            }}>
              {RATIOS.map(ratio => (
                <button
                  key={ratio.key}
                  onClick={() => setSelectedRatio(ratio)}
                  style={{
                    padding: "8px 28px",
                    background: selectedRatio.key === ratio.key ? BRAND_COLOR : "#f2fafd",
                    color: selectedRatio.key === ratio.key ? "#fff" : "#41b7c2",
                    border: "none",
                    borderRadius: 16,
                    fontWeight: 700,
                    fontSize: 17,
                    boxShadow: selectedRatio.key === ratio.key ? "0 1.5px 6px #37bac229" : undefined,
                    cursor: "pointer",
                    outline: "none",
                    letterSpacing: 0.2
                  }}>
                  {ratio.label}
                </button>
              ))}
            </div>
            {/* Copy/Download buttons */}
            <div style={{
              marginTop: 18,
              display: "flex",
              justifyContent: "flex-end",
              width: "100%",
              gap: 11
            }}>
              <button
                onClick={handleCopy}
                style={{
                  background: "#37BAC2",
                  color: "#fff",
                  border: "none",
                  borderRadius: 16,
                  padding: "10px 28px",
                  fontWeight: 700,
                  fontSize: 16.5,
                  letterSpacing: 0.15,
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer"
                }}
                title="Copy image"
              >
                Copy
              </button>
              {canvasUrl &&
                <a href={canvasUrl} download="bookcover-export.jpg" style={{
                  textDecoration: "none"
                }}>
                  <button
                    style={{
                      background: "#f7fafd",
                      color: "#37BAC2",
                      border: "1.5px solid #dbeaea",
                      borderRadius: 16,
                      padding: "10px 13px",
                      fontWeight: 700,
                      fontSize: 16,
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer"
                    }}
                    title="Download image"
                  >
                    <CloudDownload size={22} />
                  </button>
                </a>
              }
            </div>
            {/* Copy message */}
            <div style={{
              minHeight: 22,
              fontSize: 15,
              color: copyMsg.includes("Copy") ? "#21b174" : "#d85c5c",
              fontWeight: 500,
              textAlign: "center",
              marginTop: 3
            }}>
              {copyMsg}
            </div>
          </div>
        </div>
      </div>
      {/* FOOTER */}
      <div style={{
        fontSize: 15,
        color: "#8ea8ad",
        padding: "17px 0 13px 48px",
        fontWeight: 600,
        letterSpacing: 0.1,
        userSelect: "none"
      }}>
        This web app is designed by Tino Bookstore.
      </div>
    </div>
  );
}

export default App;