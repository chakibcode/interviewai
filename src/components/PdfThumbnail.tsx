import React, { useEffect, useRef } from "react";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
// Vite-friendly way to load the worker
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.min.js?url";

GlobalWorkerOptions.workerSrc = pdfjsWorker;

type PdfThumbnailProps = {
  url: string;
  height?: number; // desired thumbnail height in px
  className?: string;
};

export default function PdfThumbnail({ url, height = 100, className = "" }: PdfThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      try {
        const loadingTask = getDocument({ url });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        // Get viewport at scale = 1 to compute scale for target height
        const viewportAt1 = page.getViewport({ scale: 1 });
        const scale = height / viewportAt1.height;
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.height = Math.floor(viewport.height);
        canvas.width = Math.floor(viewport.width);

        const renderTask = page.render({ canvasContext: context, viewport, canvas });
        await renderTask.promise;

        if (!cancelled) {
          // No-op; canvas now contains the first page thumbnail
        }
      } catch (err) {
        // Silently fail; caller can choose to show fallback UI
        // console.error("Failed to render PDF thumbnail", err);
      }
    };

    render();

    return () => {
      cancelled = true;
    };
  }, [url, height]);

  return (
    <div className={`overflow-hidden`} style={{ height }}>
      <canvas ref={canvasRef} className={`block ${className}`} style={{ height, width: "auto" }} />
    </div>
  );
}