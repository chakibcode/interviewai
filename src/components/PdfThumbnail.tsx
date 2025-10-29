import React, { useRef, useEffect, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';

// Set up the worker source for pdf.js
pdfjs.GlobalWorkerOptions.workerSrc = `/assets/pdf.worker.min.mjs`;

interface PdfThumbnailProps {
  url: string;
  height?: number;
}

const PdfThumbnail: React.FC<PdfThumbnailProps> = ({ url, height = 200 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [thumbSize, setThumbSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const renderPdf = async () => {
      console.log('[PdfThumbnail] Starting PDF render for URL:', url);
      if (!url) {
        console.error('[PdfThumbnail] No URL provided.');
        setError('No URL provided.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log('[PdfThumbnail] Loading PDF document...');
        const loadingTask = pdfjs.getDocument(url);
        const pdf = await loadingTask.promise;
        console.log('[PdfThumbnail] PDF document loaded:', pdf);

        console.log('[PdfThumbnail] Getting page 1...');
        const page = await pdf.getPage(1);
        console.log('[PdfThumbnail] Page 1 loaded:', page);

        const canvas = canvasRef.current;
        if (!canvas) {
          console.error('[PdfThumbnail] Canvas element not found.');
          setError('Canvas element not found.');
          setIsLoading(false);
          return;
        }
        const context = canvas.getContext('2d');
        if (!context) {
          console.error('[PdfThumbnail] Canvas 2D context not available.');
          setError('Canvas 2D context not available.');
          setIsLoading(false);
          return;
        }

        const viewport = page.getViewport({ scale: 1 });
        const scale = height / viewport.height;
        const scaledViewport = page.getViewport({ scale });
        setThumbSize({ width: scaledViewport.width, height: scaledViewport.height });

        // Render to an offscreen canvas first
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = scaledViewport.width;
        offscreenCanvas.height = scaledViewport.height;
        const offscreenContext = offscreenCanvas.getContext('2d');
        if (!offscreenContext) {
          console.error('[PdfThumbnail] Offscreen canvas 2D context not available.');
          setError('Offscreen canvas 2D context not available.');
          setIsLoading(false);
          return;
        }

        const renderContext = {
          canvasContext: offscreenContext,
          viewport: scaledViewport,
        } as any;

        await page.render(renderContext).promise;
        console.log('[PdfThumbnail] Page rendered to offscreen canvas successfully.');

        // Rotate by 15 degrees clockwise when drawing to the visible canvas
        const angleDeg = 15;
        const angleRad = (angleDeg * Math.PI) / 180;
        const w = offscreenCanvas.width;
        const h = offscreenCanvas.height;
        const rotatedW = Math.abs(w * Math.cos(angleRad)) + Math.abs(h * Math.sin(angleRad));
        const rotatedH = Math.abs(h * Math.cos(angleRad)) + Math.abs(w * Math.sin(angleRad));

        canvas.width = Math.ceil(rotatedW);
        canvas.height = Math.ceil(rotatedH);

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.save();
        context.translate(canvas.width / 2, canvas.height / 2);
        context.rotate(angleRad);
        // Use 5-argument overload to satisfy TypeScript: image, dx, dy, dWidth, dHeight
        context.drawImage(offscreenCanvas as CanvasImageSource, -w / 2, -h / 2, w, h);
        context.restore();
        console.log('[PdfThumbnail] Rotated thumbnail drawn successfully.');
        setIsLoading(false);
      } catch (err: any) {
        console.error('[PdfThumbnail] Error rendering PDF:', err);
        setError(err.message || 'Failed to render PDF.');
        setIsLoading(false);
      }
    };

    renderPdf();
  }, [url, height]);

  return (
    <div
      style={{
        width: thumbSize?.width ?? undefined,
        height: thumbSize?.height ?? undefined,
        overflow: 'hidden',
      }}
    >
      {isLoading && <div>Loading PDF...</div>}
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      <canvas ref={canvasRef} style={{ display: isLoading || error ? 'none' : 'block' }} role="img" aria-label={`Thumbnail preview of ${url}`} />
    </div>
  );
};

export default PdfThumbnail;