import { readFile } from "dcmjs";
import { createFFmpeg } from "@ffmpeg/ffmpeg";

const ffmpeg = createFFmpeg({ log: false });
let ready = false;

self.onmessage = async e => {
  const { file } = e.data;
  const arrayBuffer = await file.arrayBuffer();
  const dicom = readFile(arrayBuffer);
  const pixels = dicom.dict["x7fe00010"].Value[0];

  const frames = dicom.meta.NumberOfFrames || 1;
  const width = dicom.meta.Columns;
  const height = dicom.meta.Rows;

  if (frames === 1) {
    const blob = new Blob([new Uint8ClampedArray(pixels)], { type: "application/octet-stream" });
    const bmpUrl = URL.createObjectURL(blob);
    postMessage({ id: crypto.randomUUID(), kind: "image", imgUrl: bmpUrl });
  } else {
    if (!ready) {
      await ffmpeg.load();
      ready = true;
    }
    for (let i = 0; i < frames; i++) {
      const slice = pixels.slice(i * width * height, (i + 1) * width * height);
      ffmpeg.FS("writeFile", `frame${i}.pgm`, slice);
    }
    await ffmpeg.run("-framerate", "15", "-i", "frame%01d.pgm", "out.mp4");
    const mp4 = ffmpeg.FS("readFile", "out.mp4");
    const mp4Blob = new Blob([mp4.buffer], { type: "video/mp4" });
    const mp4Url = URL.createObjectURL(mp4Blob);
    const thumbUrl = mp4Url + "#t=0.1";

    postMessage({
      id: crypto.randomUUID(),
      kind: "video",
      mp4Url,
      mp4Blob,
      thumbUrl
    });
  }
};