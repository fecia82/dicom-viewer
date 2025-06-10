import React, { useRef, useState, useEffect } from "react";

export default function Viewer({ asset, onClose, onCapture, onNoteChange }) {
  const videoRef = useRef();
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 1;
    }
  }, [asset]);

  if (!asset) return null;

  const capture = () => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(v, 0, 0);
    onCapture(canvas.toDataURL("image/png"));
  };

  return (
    <div className="viewer">
      <div className="viewer-inner">
        <button onClick={onClose}>✕</button>
        {asset.kind === "video" ? (
          <div>
            <video ref={videoRef} src={asset.mp4Url} controls autoPlay />
            {!asset.fps && (
              <label>
                Velocidad:
                <input
                  type="number"
                  step="0.1"
                  value={speed}
                  onChange={e => {
                    setSpeed(e.target.value);
                    if (videoRef.current) videoRef.current.playbackRate = e.target.value;
                  }}
                />
              </label>
            )}
            <button onClick={capture}>Capturar fotograma</button>
          </div>
        ) : (
          <img src={asset.imgUrl} alt="view" />
        )}
        <textarea
          placeholder="Texto…"
          value={asset.note || ""}
          onChange={e => onNoteChange(asset.id, e.target.value)}
        />
      </div>
    </div>
  );
}

