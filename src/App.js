import React, { useRef, useState } from "react";
import { Download, Copy } from "lucide-react"; // Feather-style icons

const RATIOS = [
  { key: "auto", label: "Auto", w: 500, h: 400 },
  { key: "square", label: "Square", w: 600, h: 600 },
  { key: "insta", label: "Instagram post", w: 1080, h: 1350 },
];

function App() {
  const [imgUrl, setImgUrl] = useState("");
  const [mainColor, setMainColor] = useState("#37BAC2");
  const [canvasUrl, setCanvasUrl] = useState("");
  const [selectedRatio, setSelectedRatio] = useState(RATIOS[0]);
  const [copyMsg, setCopyMsg] = useState("");
  const imgRef = useRef();

  // Main color extraction (average color)
  const getMainColor = (img) => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, img.width, img.height).data;
    let r = 0, g = 0, b = 0, count = 0;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count++;
    }
    return (
      "#" +
      [Math.round(r / count), Math.round(g / count), Math.round(b / count)]
        .map((x) => x.toString(16).padStart(2, "0"))
        .join("")
    );
  };

  // Handle upload
  const handleImage = (e) => {
    setCopyMsg("");
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImgUrl(url);

    const img = new window.Image();
    img.src = url;
    img.onload = () => {
      const color = getMainColor(img);
      setMainColor(color);
    };
  };

  // Render canvas for preview/export
  const renderCanvas = () => {
    if (!imgUrl) return;
    const { w, h } = selectedRatio;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");

    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, "#37BAC2");
    gradient.addColorStop(1, mainColor);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // Draw book cover (1/6 area)
    const img = imgRef.current;
    if (img) {
      const area = (w * h) / 6;
      const aspect = img.naturalWidth / img.naturalHeight;
      let imgH = Math.sqrt(area / aspect);
      let imgW = imgH * aspect;
      if (imgW > w * 0.8) {
        imgW = w * 0.8;
        imgH = imgW / aspect;
      }
      if (imgH > h * 0.8) {
        imgH = h * 0.8;
        imgW = imgH * aspect;
      }
      ctx.save();
      ctx.shadowColor = "rgba(50,150,180,0.20)";
      ctx.shadowBlur = 24;
      ctx.drawImage(
        img,
        (w - imgW) / 2,
        (h - imgH) / 2,
        imgW,
        imgH
      );
      ctx.restore();
    }
    const url = canvas.toDataURL("image/png");
    setCanvasUrl(url);
  };

  React.useEffect(() => {
    if (imgUrl) renderCanvas();
    // eslint-disable-next-line
  }, [imgUrl, mainColor, selectedRatio]);

  // Copy image to clipboard
  const handleCopy = async () => {
    if (!canvasUrl) return;
    try {
      const res = await fetch(canvasUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new window.ClipboardItem({ [blob.type]: blob }),
      ]);
      setCopyMsg("Copied!");
      setTimeout(() => setCopyMsg(""), 1200);
    } catch (e) {
      setCopyMsg("Copy not supported.");
      setTimeout(() => setCopyMsg(""), 1600);
    }
  };

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: "#F9FAFB"
    }}>
      {/* Left panel: upload */}
      <div style={{
        flex: "0 0 340px",
        padding: 36,
        borderRight: "1.5px solid #e5eaf0",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "#f8fcfd",
        minHeight: "100vh"
      }}>
        <div style={{
          width: "100%",
          maxWidth: 320,
          borderRadius: 30,
          background: "#fff",
          boxShadow: "0 8px 36px #baeaf71a",
          padding: 36,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          <div style={{
            fontWeight: 700,
            fontSize: 19,
            marginBottom: 20,
            letterSpacing: 0.6
          }}>Book Cover Upload</div>
          <label
            htmlFor="upload"
            style={{
              display: "block",
              padding: "12px 22px",
              background: "#F2FCFD",
              color: "#1792a7",
              borderRadius: 18,
              border: "2px dashed #37BAC2",
              fontWeight: 600,
              fontSize: 16,
              cursor: "pointer",
              marginBottom: 22,
              textAlign: "center",
              width: "100%"
            }}
          >
            <span style={{marginRight: 8, fontSize: 20}}>
              <Download size={20} style={{verticalAlign: "middle"}} />
            </span>
            Upload image
            <input
              id="upload"
              type="file"
              accept="image/*"
              onChange={handleImage}
              style={{ display: "none" }}
            />
          </label>
          {imgUrl && (
            <div style={{
              width: 140,
              height: 140,
              borderRadius: 16,
              overflow: "hidden",
              margin: "0 auto",
              background: "#f6fbfd",
              boxShadow: "0 1px 7px #67d4ed15",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <img
                ref={imgRef}
                src={imgUrl}
                alt="book cover"
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  borderRadius: 14,
                  objectFit: "contain"
                }}
              />
            </div>
          )}
          {imgUrl && (
            <div style={{
              display: "flex",
              alignItems: "center",
              marginTop: 4,
              fontSize: 14,
              fontWeight: 600
            }}>
              <span style={{
                display: "inline-block",
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: mainColor,
                border: "2.5px solid #37BAC2",
                marginRight: 8
              }}></span>
              <span style={{color: "#1792a7"}}>{mainColor}</span>
            </div>
          )}
        </div>
      </div>
      {/* Right panel: export tool */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: 0
      }}>
        <div style={{
          background: "#fff",
          borderRadius: 40,
          boxShadow: "0 8px 36px #baeaf71a",
          padding: "38px 38px 28px 38px",
          minWidth: 360,
          maxWidth: 560,
          width: "90%",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          {/* Top bar: Ratio dropdown + buttons */}
          <div style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            marginBottom: 20
          }}>
            {/* Ratio Dropdown */}
            <div style={{ position: "relative" }}>
              <select
                value={selectedRatio.key}
                onChange={e =>
                  setSelectedRatio(RATIOS.find(r => r.key === e.target.value))
                }
                style={{
                  appearance: "none",
                  padding: "9px 32px 9px 16px",
                  fontSize: 17,
                  borderRadius: 16,
                  border: "1.7px solid #c6eaf0",
                  background: "#f7fdff",
                  fontWeight: 600,
                  outline: "none",
                  boxShadow: "0 1.5px 10px #e5f7fa1c",
                  marginRight: 12,
                  minWidth: 108,
                  color: "#1f595f"
                }}>
                {RATIOS.map(r => (
                  <option value={r.key} key={r.key}>{r.label}</option>
                ))}
              </select>
              {/* Down arrow */}
              <span style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                color: "#1792a7",
                fontSize: 18
              }}>▼</span>
            </div>
            {/* Ratio label */}
            <span style={{
              fontWeight: 700,
              fontSize: 16.5,
              background: "#e6f9fc",
              padding: "7px 18px",
              borderRadius: 18,
              marginLeft: 8,
              color: "#37BAC2"
            }}>
              {selectedRatio.label}
            </span>
            <div style={{ flex: 1 }} />
            {/* Copy & Download icons (no text) */}
            {canvasUrl && (
              <>
                <button
                  onClick={handleCopy}
                  style={{
                    border: "none",
                    background: "#f7fdff",
                    color: "#1792a7",
                    padding: "11px 15px",
                    borderRadius: 18,
                    marginRight: 6,
                    fontWeight: 700,
                    fontSize: 16,
                    boxShadow: "0 1px 5px #6cd8de14",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    minWidth: 0
                  }}
                  aria-label="Copy image"
                >
                  <Copy size={22} strokeWidth={2.2} />
                </button>
                <a href={canvasUrl} download="background.png"
                  style={{ textDecoration: "none" }}>
                  <button
                    style={{
                      border: "none",
                      background: "#37BAC2",
                      color: "#fff",
                      padding: "11px 15px",
                      borderRadius: 18,
                      fontWeight: 700,
                      fontSize: 16,
                      boxShadow: "0 2px 6px #6cd8de24",
                      cursor: "pointer",
                      marginLeft: 2,
                      display: "flex",
                      alignItems: "center",
                      minWidth: 0
                    }}
                    aria-label="Download image"
                  >
                    <Download size={22} strokeWidth={2.2} />
                  </button>
                </a>
              </>
            )}
          </div>
          {/* Export preview */}
          <div style={{
            width: selectedRatio.w / 2.3,
            height: selectedRatio.h / 2.3,
            maxWidth: 370,
            maxHeight: 580,
            minHeight: 220,
            borderRadius: 26,
            background: `linear-gradient(135deg,#37BAC2,${mainColor})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px #bfeef927",
            marginBottom: 14,
            border: "2.5px solid #f2fafd"
          }}>
            {canvasUrl ?
              <img
                src={canvasUrl}
                alt="result"
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  borderRadius: 26,
                  boxShadow: "0 2px 10px #5fcdd122"
                }}
              /> :
              <span style={{
                color: "#aaa",
                fontSize: 18
              }}>
                {imgUrl ? "Creating preview..." : "No book cover uploaded"}
              </span>
            }
          </div>
          {/* Copy notification */}
          <div style={{
            minHeight: 22,
            fontSize: 15,
            color: copyMsg.includes("Copy") || copyMsg.includes("copied") ? "#21b174" : "#d85c5c",
            fontWeight: 500,
            textAlign: "center"
          }}>
            {copyMsg}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;