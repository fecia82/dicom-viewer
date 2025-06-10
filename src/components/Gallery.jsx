import React from "react";

export default function Gallery({ assets, selected, toggle }) {
  return (
    <div className="grid">
      {assets.map(a => (
        <div
          key={a.id}
          className={"card" + (selected.includes(a) ? " sel" : "")}
          onClick={() => toggle(a)}
        >
          {a.kind === "video" ? (
            <video
              src={a.mp4Url}
              poster={a.thumbUrl}
              muted
              playsInline
            />
          ) : (
            <img src={a.imgUrl} alt="preview" />
          )}
        </div>
      ))}
    </div>
  );
}