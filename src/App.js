import React, { useRef, useState } from "react";
import { Upload, ClipboardCopy, Copy, Facebook, Instagram, Globe } from "lucide-react";

const RATIOS = [
  { key: "1:1", label: "1:1", w: 600, h: 600 },
  { key: "4:5", label: "4:5", w: 640, h: 800 },
  { key: "9:16", label: "9:16", w: 720, h: 1280 },
];

const BRAND_COLOR = "#37BAC2";

function App() {
  const [imgUrl, setImgUrl] = useState("");
  const [canvasUrl, setCanvasUrl] = useState("");
  const [selectedRatio, setSelectedRatio] = useState(RATIOS[0]);
  const [isClipboardLoading, setClipboardLoading] = useState(false);
  const [copyMsg, setCopyMsg] = useState("");
  const imgRef = useRef();

  // Handle upload from file
  const handleImage = (e) => {
    setCopyMsg("");
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImgUrl(url);
  };

  // Handle paste from clipboard
  const handlePasteClipboard = async () => {
    setClipboardLoading(true);
    setCopyMsg("");
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
          const blob = await item.getType(item.types[0]);
          const url = URL.createObjectURL(blob);
          setImgUrl(url);
          setClipboardLoading(false);
          return;
        }
      }
      setCopyMsg("No image in clipboard.");
    } catch {
      setCopyMsg("Clipboard not supported.");
    }
    setClipboardLoading(false);
  };

  // Draw the export canvas with watermark
  const renderCanvas = () => {
    if (!imgUrl) return;
    const { w, h } = selectedRatio;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");

    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, BRAND_COLOR);
    gradient.addColorStop(1, "#fff");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // Draw book cover (centered, not exceeding 60% result size)
    const img = imgRef.current;
    if (img) {
      const maxW = w * 0.60;
      const maxH = h * 0.60;
      const aspect = img.naturalWidth / img.naturalHeight;
      let imgW = maxW, imgH = maxW / aspect;
      if (imgH > maxH) {
        imgH = maxH;
        imgW = imgH * aspect;
      }
      ctx.save();
      ctx.shadowColor = "rgba(55,186,194,0.09)";
      ctx.shadowBlur = 32;
      ctx.drawImage(
        img,
        (w - imgW) / 2,
        (h - imgH) / 2,
        imgW,
        imgH
      );
      ctx.restore();
    }

    // Draw watermark (bottom right, margin 24px)
    ctx.save();
    ctx.font = `bold ${Math.round(h * 0.045)}px Inter, Arial, sans-serif`;
    ctx.textBaseline = "bottom";
    ctx.textAlign = "right";
    ctx.globalAlpha = 0.42;
    ctx.fillStyle = "#111";
    ctx.fillText("@tinoreading", w - 24, h - 24);
    ctx.restore();

    setCanvasUrl(canvas.toDataURL("image/png"));
  };

  // Auto render when image or ratio changes
  React.useEffect(() => {
    if (imgUrl) renderCanvas();
    // eslint-disable-next-line
  }, [imgUrl, selectedRatio]);

  // Copy export to clipboard
  const handleCopy = async () => {
    if (!canvasUrl) return;
    try {
      const res = await fetch(canvasUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new window.ClipboardItem({ [blob.type]: blob }),
      ]);
      setCopyMsg("Copied!");
      setTimeout(() => setCopyMsg(""), 1300);
    } catch {
      setCopyMsg("Copy failed.");
      setTimeout(() => setCopyMsg(""), 1500);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F8FAFB",
      fontFamily: "Inter, Arial, sans-serif",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 58,
        padding: "0 44px 0 36px",
        borderBottom: "1.5px solid #e9f0f1",
        background: "#fff",
      }}>
        <div style={{fontWeight: 700, fontSize: 20, color: "#1b6272"}}>@tinoreading</div>
        <div style={{display: "flex", gap: 24}}>
          <a href="https://tinoreading.club/" target="_blank" rel="noopener noreferrer">
            <Globe size={21} color="#37BAC2" />
          </a>
          <a href="https://facebook.com/tinoreading" target="_blank" rel="noopener noreferrer">
            <Facebook size={21} color="#37BAC2" />
          </a>
          <a href="https://instagram.com/tinoreading" target="_blank" rel="noopener noreferrer">
            <Instagram size={21} color="#37BAC2" />
          </a>
        </div>
      </div>

      {/* Main layout */}
      <div style={{
        flex: 1,
        display: "flex",
        height: "calc(100vh - 58px)",
        minHeight: 400
      }}>
        {/* Left: Upload */}
        <div style={{
          flex: "0 0 390px",
          padding: "42px 24px 0 42px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{
            width: 310,
            minHeight: 300,
            background: "#fff",
            borderRadius: 36,
            boxShadow: "0 4px 26px #abe9fa18",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "38px 22px 32px 22px"
          }}>
            <label htmlFor="upload-image" style={{
              cursor: "pointer",
              borderRadius: 20,
              padding: "12px 22px",
              background: "#F2FCFD",
              border: `2px dashed ${BRAND_COLOR}`,
              color: BRAND_COLOR,
              fontWeight: 600,
              fontSize: 17,
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 30
            }}>
              <Upload size={21} style={{marginBottom: -2}} />
              <span>Upload image</span>
              <input id="upload-image" type="file" accept="image/*" onChange={handleImage} style={{display: "none"}} />
            </label>

            <button onClick={handlePasteClipboard} disabled={isClipboardLoading}
              style={{
                background: "#f7fafd",
                border: "1.6px solid #e1eaea",
                borderRadius: 18,
                color: "#3e9cab",
                fontWeight: 600,
                fontSize: 16,
                padding: "10px 16px",
                marginBottom: 12,
                marginTop: 2,
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 9,
                cursor: isClipboardLoading ? "wait" : "pointer",
                transition: "background 0.18s"
              }}>
              <ClipboardCopy size={20} />
              <span>
                {isClipboardLoading ? "Pasting..." : "Paste from clipboard"}
              </span>
            </button>

            {/* Book cover preview */}
            <div style={{
              marginTop: 20,
              width: 136,
              height: 136,
              borderRadius: 17,
              background: "#f5fafd",
              boxShadow: "0 1px 8px #1d929811",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              {imgUrl ?
                <img
                  ref={imgRef}
                  src={imgUrl}
                  alt="book cover"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    borderRadius: 15
                  }}
                  crossOrigin="anonymous"
                /> :
                <span style={{
                  color: "#bbb",
                  fontWeight: 500
                }}>
                  No image
                </span>
              }
            </div>
          </div>
        </div>
        {/* Right: Export/Preview */}
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 40px 0 0"
        }}>
          <div style={{
            width: 380,
            minHeight: 480,
            background: "#fff",
            borderRadius: 36,
            boxShadow: "0 4px 26px #abe9fa18",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "36px 28px 28px 28px"
          }}>
            {/* Result preview gradient area */}
            <div style={{
              width: 232,
              height: 232,
              borderRadius: 23,
              background: `linear-gradient(135deg, ${BRAND_COLOR}, #fff)`,
              boxShadow: "0 1.5px 12px #54cfe925",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative"
            }}>
              {canvasUrl ?
                <img
                  src={canvasUrl}
                  alt="result"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    borderRadius: 23,
                    background: "#fff"
                  }}
                /> :
                <span style={{
                  color: "#b9babd",
                  fontSize: 18,
                  fontWeight: 500
                }}>
                  Export preview
                </span>
              }
            </div>
            {/* Ratio buttons */}
            <div style={{
              marginTop: 22,
              width: "100%",
              display: "flex",
              justifyContent: "center",
              gap: 12
            }}>
              {RATIOS.map((ratio, i) => (
                <button key={ratio.key}
                  onClick={() => setSelectedRatio(ratio)}
                  style={{
                    padding: "7.5px 25px",
                    background: selectedRatio.key === ratio.key ? BRAND_COLOR : "#f2fafd",
                    color: selectedRatio.key === ratio.key ? "#fff" : "#41b7c2",
                    border: "none",
                    borderRadius: 16,
                    fontWeight: 700,
                    fontSize: 16,
                    boxShadow: selectedRatio.key === ratio.key ? "0 1.5px 6px #37bac229" : undefined,
                    cursor: "pointer",
                    outline: "none",
                    letterSpacing: 0.2
                  }}>
                  {ratio.label}
                </button>
              ))}
            </div>
            {/* Copy/download row */}
            <div style={{
              marginTop: 18,
              display: "flex",
              justifyContent: "flex-end",
              width: "100%"
            }}>
              <button onClick={handleCopy}
                style={{
                  background: "#f8fdff",
                  border: "1.5px solid #dbeaea",
                  borderRadius: 15,
                  padding: "9px 13px",
                  color: "#37bac2",
                  fontWeight: 700,
                  fontSize: 16,
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  marginRight: 5
                }}
                title="Copy image"
              >
                <Copy size={20} />
              </button>
              {canvasUrl &&
                <a href={canvasUrl} download="bookcover-export.png" style={{
                  textDecoration: "none"
                }}>
                  <button
                    style={{
                      background: "#37bac2",
                      color: "#fff",
                      border: "none",
                      borderRadius: 15,
                      padding: "9px 13px",
                      fontWeight: 700,
                      fontSize: 16,
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer"
                    }}
                    title="Download image"
                  >
                    <Upload size={20} />
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
      {/* Footer */}
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