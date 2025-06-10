import React, { useState, useEffect, useRef } from "react";
import Gallery from "./components/Gallery.jsx";
import PptxGenJS from "pptxgenjs";

export default function App() {
  const [assets, setAssets] = useState([]);
  const [sel, setSel] = useState([]);
  const [note, setNote] = useState("");
  const workerRef = useRef();

  useEffect(() => {
    workerRef.current = new Worker(new URL("./worker.js", import.meta.url), {
      type: "module"
    });
    workerRef.current.onmessage = e => {
      setAssets(prev => [...prev, e.data]);
    };
    return () => workerRef.current.terminate();
  }, []);

  const openFolder = async () => {
    try {
      const dirHandle = await window.showDirectoryPicker();
      for await (const entry of dirHandle.values()) {
        if (entry.kind === "file") {
          const file = await entry.getFile();
          workerRef.current.postMessage({ file });
        }
      }
    } catch (err) {
      alert("Elige Chrome/Edge o usa el selector de archivos");
    }
  };

  const toggle = a =>
    setSel(s => (s.includes(a) ? s.filter(x => x !== a) : [...s, a]));

  const exportPPTX = async () => {
    const pptx = new PptxGenJS();
    for (const a of sel) {
      const slide = pptx.addSlide();
      if (a.kind === "image") {
        slide.addImage({ data: a.imgUrl, x: 1, y: 1, w: 8, h: 8 });
      } else {
        slide.addMedia({ type: "video", data: a.mp4Blob, x: 1, y: 1, w: 8, h: 8 });
      }
      if (note) slide.addText(note, { x: 0.5, y: 7.5, w: 9, h: 1 });
    }
    await pptx.writeFile("presentation.pptx");
  };

  return (
    <main>
      <h1>DICOM Viewer (100 % local)</h1>
      <p>
        <button onClick={openFolder}>📂 Abrir carpeta</button>
      </p>
      <textarea
        placeholder="Texto opcional para las diapositivas…"
        value={note}
        onChange={e => setNote(e.target.value)}
        style={{ width: "100%", minHeight: "3rem" }}
      />
      <Gallery assets={assets} selected={sel} toggle={toggle} />
      <p>
        <button disabled={!sel.length} onClick={exportPPTX}>
          Exportar {sel.length} elemento(s) ➜ PPTX
        </button>
      </p>
    </main>
  );
}