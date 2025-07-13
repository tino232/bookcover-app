import React, { useRef, useState } from "react";

// Danh sách tỷ lệ
const RATIOS = [
  { key: "5:4", label: "5:4", w: 500, h: 400 },
  { key: "1:1", label: "Square", w: 600, h: 600 },
  { key: "9:16", label: "Instagram post", w: 900, h: 1600 },
];

function App() {
  const [imgUrl, setImgUrl] = useState("");
  const [mainColor, setMainColor] = useState("#FFFFFF");
  const [canvasUrl, setCanvasUrl] = useState("");
  const [selectedRatio, setSelectedRatio] = useState(RATIOS[0]);
  const [copyMsg, setCopyMsg] = useState("");
  const imgRef = useRef();

  // Hàm lấy màu chủ đạo (trung bình)
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

  // Tạo gradient đúng nghĩa
  const renderCanvas = () => {
    if (!imgUrl) return;
    const { w, h } = selectedRatio;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");

    // Gradient mượt giữa #37BAC2 và màu chủ đạo
    const grd = ctx.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, "#37BAC2");
    grd.addColorStop(1, mainColor);

    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    // Ảnh bìa chiếm 1/6 diện tích, luôn nằm giữa
    const img = imgRef.current;
    if (img) {
      const area = (w * h) / 6;
      const aspect = img.naturalWidth / img.naturalHeight;
      let imgH = Math.sqrt(area / aspect);
      let imgW = imgH * aspect;
      // Giới hạn không vượt khổ nền
      if (imgW > w * 0.9) {
        imgW = w * 0.9;
        imgH = imgW / aspect;
      }
      if (imgH > h * 0.9) {
        imgH = h * 0.9;
        imgW = imgH * aspect;
      }
      ctx.drawImage(
        img,
        (w - imgW) / 2,
        (h - imgH) / 2,
        imgW,
        imgH
      );
    }

    const url = canvas.toDataURL("image/png");
    setCanvasUrl(url);
  };

  // Tự động render khi đổi ảnh hoặc tỷ lệ
  React.useEffect(() => {
    if (imgUrl) renderCanvas();
    // eslint-disable-next-line
  }, [imgUrl, mainColor, selectedRatio]);

  // Copy ảnh vào clipboard
  const handleCopy = async () => {
    if (!canvasUrl) return;
    try {
      const res = await fetch(canvasUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new window.ClipboardItem({ [blob.type]: blob }),
      ]);
      setCopyMsg("Đã copy ảnh vào clipboard!");
      setTimeout(() => setCopyMsg(""), 1800);
    } catch (e) {
      setCopyMsg("Không copy được trên trình duyệt này.");
      setTimeout(() => setCopyMsg(""), 2000);
    }
  };

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      background: "#fafbfc"
    }}>
      {/* Cột trái: Upload */}
      <div style={{
        width: "26%",
        minWidth: 240,
        maxWidth: 400,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
        borderRight: "1.5px solid #e3e3e3",
        background: "#f4fafd"
      }}>
        <div style={{
          background: "#fff",
          padding: 32,
          borderRadius: 32,
          boxShadow: "0 6px 32px #a7e6ed13",
          width: "100%",
          maxWidth: 340
        }}>
          <h3 style={{
            textAlign: "center",
            marginBottom: 24,
            marginTop: 0,
            letterSpacing: 1,
            fontWeight: 800,
            fontSize: 20
          }}>Upload Bìa Sách</h3>
          <input type="file" accept="image/*" onChange={handleImage}
            style={{
              display: "block",
              width: "100%",
              margin: "12px 0 24px 0",
              fontSize: 16,
              padding: 8,
              borderRadius: 16,
              border: "1.5px solid #c7ecee",
              background: "#f9ffff"
            }} />
          {imgUrl && (
            <>
              <img
                ref={imgRef}
                src={imgUrl}
                alt="book cover"
                style={{
                  display: "block",
                  width: "100%",
                  maxWidth: 160,
                  maxHeight: 160,
                  borderRadius: 18,
                  boxShadow: "0 2px 14px #64bfc417"
                }}
              />
              <div style={{
                marginTop: 16,
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 16
              }}>
                <span style={{
                  display: "inline-block",
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: mainColor,
                  border: "2.5px solid #37BAC2"
                }}></span>
                <span style={{
                  fontWeight: 600,
                  color: "#333",
                  letterSpacing: 1
                }}>{mainColor}</span>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Cột phải: Kết quả */}
      <div style={{
        flex: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: 0,
        padding: 0
      }}>
        <div style={{
          background: "#fff",
          borderRadius: 40,
          boxShadow: "0 6px 28px #a7e6ed13",
          padding: 32,
          minWidth: 320,
          maxWidth: 700,
          width: "92%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minHeight: 420
        }}>
          {/* Selector tỷ lệ */}
          <div style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20
          }}>
            <select
              value={selectedRatio.key}
              onChange={e => setSelectedRatio(RATIOS.find(r => r.key === e.target.value))}
              style={{
                padding: "8px 18px",
                fontSize: 17,
                borderRadius: 16,
                border: "1.5px solid #b0e0e6",
                background: "#f8feff",
                fontWeight: 600
              }}>
              {RATIOS.map(r => (
                <option value={r.key} key={r.key}>{r.label}</option>
              ))}
            </select>
            <span style={{
              fontWeight: 700,
              fontSize: 17,
              background: "#f0fcfc",
              padding: "7px 16px",
              borderRadius: 18,
              marginLeft: 12,
              color: "#28848a"
            }}>
              Tỷ lệ: {selectedRatio.label} ({selectedRatio.w}×{selectedRatio.h})
            </span>
            <div style={{ flex: 1 }} />
            {canvasUrl &&
              <>
                <button
                  onClick={handleCopy}
                  style={{
                    border: "none",
                    background: "#f8fcff",
                    padding: "8px 16px",
                    borderRadius: 18,
                    marginRight: 8,
                    fontWeight: 600,
                    fontSize: 16,
                    boxShadow: "0 1px 5px #6cd8de12",
                    cursor: "pointer"
                  }}>
                  📋 Copy
                </button>
                <a href={canvasUrl} download="background.png"
                  style={{
                    textDecoration: "none"
                  }}>
                  <button
                    style={{
                      border: "none",
                      background: "#37BAC2",
                      color: "#fff",
                      padding: "8px 18px",
                      borderRadius: 18,
                      fontWeight: 700,
                      fontSize: 16,
                      boxShadow: "0 2px 6px #6cd8de28",
                      cursor: "pointer"
                    }}>
                    ⬇️ Download
                  </button>
                </a>
              </>
            }
          </div>
          {/* Ảnh kết quả */}
          <div style={{
            width: selectedRatio.w / 2.2,
            height: selectedRatio.h / 2.2,
            maxWidth: 380,
            maxHeight: 600,
            minHeight: 220,
            borderRadius: 24,
            background: "linear-gradient(135deg,#37BAC2, #f1f6f8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px #bfeef927"
          }}>
            {canvasUrl ?
              <img
                src={canvasUrl}
                alt="result"
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  borderRadius: 24,
                  boxShadow: "0 2px 10px #5fcdd122"
                }}
              /> :
              <span style={{
                color: "#aaa",
                fontSize: 18
              }}>
                {imgUrl ? "Đang tạo nền..." : "Chưa có ảnh bìa nào"}
              </span>
            }
          </div>
          {/* Thông báo copy */}
          <div style={{
            minHeight: 22,
            marginTop: 10,
            fontSize: 15,
            color: copyMsg.includes("copy") ? "#21b174" : "#d85c5c",
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