import React, { useRef, useState } from "react";

function App() {
  const [imgUrl, setImgUrl] = useState("");
  const [mainColor, setMainColor] = useState("#FFFFFF");
  const [canvasUrl, setCanvasUrl] = useState("");
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

  // Render canvas, mix gradient và export ảnh
  const renderCanvas = (ratio) => {
    if (!imgUrl) return;
    let [w, h] = [500, 400]; // default 5:4
    if (ratio === "9:16") [w, h] = [450, 800];
    if (ratio === "1:1") [w, h] = [600, 600];

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");

    // Gradient: 30% xanh #37BAC2, 70% màu chủ đạo
    const grd = ctx.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, "#37BAC2");
    grd.addColorStop(0.3, "#37BAC2");
    grd.addColorStop(0.31, mainColor);
    grd.addColorStop(1, mainColor);

    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    // Ảnh bìa chiếm 1/6 diện tích hình
    const img = imgRef.current;
    let imgW = w * Math.sqrt(1 / 6), imgH = h * Math.sqrt(1 / 6);
    if (img) {
      ctx.drawImage(
        img,
        (w - imgW) / 2,
        (h - imgH) / 2,
        imgW,
        imgH
      );
    }

    const url = canvas.toDataURL();
    setCanvasUrl(url);
  };

  return (
    <div style={{ textAlign: "center", padding: 32, fontFamily: "sans-serif" }}>
      <h2>Book Cover Gradient Background Generator</h2>
      <input type="file" accept="image/*" onChange={handleImage} />
      {imgUrl && (
        <>
          <div style={{ margin: 20 }}>
            <img
              ref={imgRef}
              src={imgUrl}
              alt="book cover"
              style={{
                maxWidth: 160,
                maxHeight: 160,
                boxShadow: "0 2px 8px #8888"
              }}
            />
            <div style={{ marginTop: 12 }}>
              Chủ đạo: <span style={{ background: mainColor, padding: 6, borderRadius: 6 }}>{mainColor}</span>
            </div>
          </div>
          <div>
            <button onClick={() => renderCanvas("5:4")}>Tạo ảnh 5:4</button>
            <button onClick={() => renderCanvas("9:16")}>Tạo ảnh 9:16</button>
            <button onClick={() => renderCanvas("1:1")}>Tạo ảnh 1:1</button>
          </div>
        </>
      )}
      {canvasUrl && (
        <div style={{ margin: 20 }}>
          <img src={canvasUrl} alt="background" style={{ maxWidth: "90%", borderRadius: 16, border: "1px solid #eee" }} />
          <div>
            <a href={canvasUrl} download="background.png">
              <button style={{ margin: 12 }}>Tải ảnh về</button>
            </a>
          </div>
        </div>
      )}
      <div style={{ marginTop: 32, fontSize: 13, color: "#888" }}>
        Không lưu ảnh. Mọi xử lý màu đều trên trình duyệt.
      </div>
    </div>
  );
}

export default App;