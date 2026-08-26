'use client';

import { useEffect, useRef, RefObject } from 'react';
import { FRAME_COUNT } from '@/lib/sequenceConfig';

interface UseCanvasSequenceOptions {
  canvasRef: RefObject<HTMLCanvasElement>;
  images: HTMLImageElement[];
  currentFrameRef: RefObject<number>;
  isReady: boolean;
  objectFit?: 'contain' | 'cover';
}

export function useCanvasSequence({
  canvasRef,
  images,
  currentFrameRef,
  isReady,
  objectFit = 'contain',
}: UseCanvasSequenceOptions) {
  const lastDrawnFrameRef = useRef<number>(-1);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isReady || !canvasRef.current || images.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let displayWidth = 0;
    let displayHeight = 0;
    let dpr = 1;

    const updateCanvasDimensions = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for optimal battery/perf balance

      displayWidth = rect.width;
      displayHeight = rect.height;

      const targetWidth = Math.round(displayWidth * dpr);
      const targetHeight = Math.round(displayHeight * dpr);

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        // Invalidate last drawn frame so resize immediately re-renders
        lastDrawnFrameRef.current = -1;
      }
    };

    updateCanvasDimensions();
    window.addEventListener('resize', updateCanvasDimensions, { passive: true });

    // Draw single frame to canvas
    const drawFrame = (frameIndex: number) => {
      const clampedIndex = Math.max(1, Math.min(FRAME_COUNT, frameIndex));
      const image = images[clampedIndex - 1];

      if (!image || !image.complete || image.naturalWidth === 0) return;

      const cw = canvas.width;
      const ch = canvas.height;
      const iw = image.naturalWidth;
      const ih = image.naturalHeight;

      // Clear with background color #0A0C10
      ctx.fillStyle = '#0A0C10';
      ctx.fillRect(0, 0, cw, ch);

      // Compute aspect ratio containment / cover
      let drawW: number;
      let drawH: number;
      let drawX: number;
      let drawY: number;

      const scale =
        objectFit === 'cover'
          ? Math.max(cw / iw, ch / ih)
          : Math.min(cw / iw, ch / ih);

      drawW = iw * scale;
      drawH = ih * scale;
      drawX = (cw - drawW) / 2;
      drawY = (ch - drawH) / 2;

      // Enable smooth image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(image, 0, 0, iw, ih, drawX, drawY, drawW, drawH);
      lastDrawnFrameRef.current = clampedIndex;
    };

    // Continuous requestAnimationFrame loop
    const renderLoop = () => {
      const currentTargetFrame = currentFrameRef.current ?? 1;
      
      if (currentTargetFrame !== lastDrawnFrameRef.current) {
        drawFrame(currentTargetFrame);
      }

      rafIdRef.current = requestAnimationFrame(renderLoop);
    };

    // Trigger first frame draw immediately
    drawFrame(currentFrameRef.current ?? 1);
    rafIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      window.removeEventListener('resize', updateCanvasDimensions);
    };
  }, [isReady, images, canvasRef, currentFrameRef, objectFit]);
}
