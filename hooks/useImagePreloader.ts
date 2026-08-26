'use client';

import { useState, useEffect, useRef } from 'react';
import { FRAME_COUNT, getFramePath } from '@/lib/sequenceConfig';

interface PreloaderResult {
  images: HTMLImageElement[];
  loadedCount: number;
  progress: number;
  isReady: boolean;
  error: string | null;
}

export function useImagePreloader(): PreloaderResult {
  const [loadedCount, setLoadedCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imagesRef = useRef<HTMLImageElement[]>([]);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || hasStartedRef.current) return;
    hasStartedRef.current = true;

    const images: HTMLImageElement[] = new Array(FRAME_COUNT);
    imagesRef.current = images;

    let loaded = 0;
    const batchSize = 40; // High throughput concurrent workers for rapid preloading
    let currentIndex = 0;

    const loadNext = () => {
      if (currentIndex >= FRAME_COUNT) return;

      const frameIdx = currentIndex + 1;
      const slot = currentIndex;
      currentIndex++;

      const img = new Image();

      const onDone = () => {
        loaded++;
        const pct = Math.min(100, Math.round((loaded / FRAME_COUNT) * 100));
        setLoadedCount(loaded);
        setProgress(pct);

        if (loaded >= FRAME_COUNT) {
          setIsReady(true);
        } else {
          loadNext();
        }
      };

      img.onload = () => {
        images[slot] = img;
        onDone();
      };

      img.onerror = () => {
        // Fallback placeholder if single frame fails
        onDone();
      };

      img.src = getFramePath(frameIdx);
    };

    // Spawn concurrent loading workers
    const initialWorkers = Math.min(batchSize, FRAME_COUNT);
    for (let i = 0; i < initialWorkers; i++) {
      loadNext();
    }

    return () => {
      // cleanup if unmounted
    };
  }, []);

  return {
    images: imagesRef.current,
    loadedCount,
    progress,
    isReady,
    error,
  };
}
