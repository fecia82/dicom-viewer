import dcmjs from "dcmjs";
import { FFmpeg } from "@ffmpeg/ffmpeg";

const ffmpeg = new FFmpeg();
let ready = false;

self.onmessage = async e => {
  const { file } = e.data;
  const arrayBuffer = await file.arrayBuffer();
  const dicom = dcmjs.data.DicomMessage.readFile(arrayBuffer);
  const pixels = dicom.dict["x7fe00010"].Value[0];

  const frames = dicom.meta.NumberOfFrames || 1;
  const width = dicom.meta.Columns;
  const height = dicom.meta.Rows;

  const modalityEl = dicom.dict["x00080060"] || dicom.dict["00080060"];
  const modality = modalityEl?.Value?.[0] || "";
  const isXA = modality === "XA";

  const frameTimeEl = dicom.dict["x00181063"] || dicom.dict["00181063"];
  const fps = frameTimeEl ? 1000 / parseFloat(frameTimeEl.Value[0]) : null;

  if (frames === 1) {
    const blob = new Blob([new Uint8ClampedArray(pixels)], { type: "application/octet-stream" });
    const bmpUrl = URL.createObjectURL(blob);
    postMessage({ id: crypto.randomUUID(), kind: "image", imgUrl: bmpUrl, modality, isXA });
  } else {
    if (!ready) {
      await ffmpeg.load();
      ready = true;
    }
    for (let i = 0; i < frames; i++) {
      const slice = pixels.slice(i * width * height, (i + 1) * width * height);
      const header = `P5\n${width} ${height}\n255\n`;
      const data = new Uint8Array(header.length + slice.length);
      data.set(new TextEncoder().encode(header), 0);
      data.set(slice, header.length);
      await ffmpeg.writeFile(`frame${i}.pgm`, data);
    }
    await ffmpeg.exec(["-framerate", fps ? String(fps) : "15", "-i", "frame%03d.pgm", "out.mp4"]);
    const mp4 = await ffmpeg.readFile("out.mp4");
    const mp4Blob = new Blob([mp4.buffer], { type: "video/mp4" });
    const mp4Url = URL.createObjectURL(mp4Blob);
    const thumbUrl = mp4Url + "#t=0.1";

    postMessage({
      id: crypto.randomUUID(),
      kind: "video",
      mp4Url,
      mp4Blob,
      thumbUrl,
      modality,
      isXA,
      fps
    });
  }
};