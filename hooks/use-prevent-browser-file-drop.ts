'use client';

import { useEffect } from 'react';

/** Stops the browser from opening dropped files (e.g. PDF in a new tab). */
export function usePreventBrowserFileDrop(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const onDragOver = (event: DragEvent) => {
      if (event.dataTransfer?.types.includes('Files')) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
      }
    };

    const onDrop = (event: DragEvent) => {
      if (event.dataTransfer?.types.includes('Files')) {
        event.preventDefault();
      }
    };

    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
    };
  }, [enabled]);
}
