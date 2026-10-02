import { useEffect, useRef } from 'react';

interface UseBarcodeScannerProps {
  onScan: (barcode: string) => void;
  minChars?: number;
  maxIntervalMs?: number;
}

/**
 * Hook to listen for keyboard wedge barcode scanners.
 * Hardware scanners send keystrokes in ultra-rapid succession (typically < 35ms) followed by an 'Enter' key.
 */
export const useBarcodeScanner = ({
  onScan,
  minChars = 3,
  maxIntervalMs = 50,
}: UseBarcodeScannerProps) => {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing into an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const now = Date.now();
      const interval = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        if (bufferRef.current.length >= minChars) {
          e.preventDefault();
          const scannedCode = bufferRef.current.trim();
          bufferRef.current = '';
          onScan(scannedCode);
        } else {
          bufferRef.current = '';
        }
        return;
      }

      // If characters are coming in too slowly, it's normal human typing, reset
      if (interval > maxIntervalMs && bufferRef.current.length > 0) {
        bufferRef.current = '';
      }

      // Only capture single alphanumeric/symbol characters
      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onScan, minChars, maxIntervalMs]);
};
