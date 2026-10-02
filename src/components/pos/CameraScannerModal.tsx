import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, BrowserCodeReader } from '@zxing/browser';
import { Camera, X, RefreshCw, Zap, CheckCircle2 } from 'lucide-react';

import { sounds } from '../../utils/audio';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Scan Product Barcode',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [continuousMode, setContinuousMode] = useState<boolean>(true);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const lastScanTimeRef = useRef<number>(0);

  // Initialize camera list
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setErrorMsg(null);
    setLastScannedCode(null);

    const initDevices = async () => {
      try {
        const videoDevices = await BrowserCodeReader.listVideoInputDevices();
        if (isMounted) {
          setDevices(videoDevices);
          if (videoDevices.length > 0) {
            // Prefer back/environment camera if available
            const backCam = videoDevices.find((d) =>
              /back|rear|environment/i.test(d.label)
            );
            setSelectedDeviceId(backCam ? backCam.deviceId : videoDevices[0].deviceId);
          } else {
            setErrorMsg('No video camera detected on this device.');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMsg(err.message || 'Unable to access camera permissions.');
        }
      }
    };

    initDevices();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Start video stream & decoding
  useEffect(() => {
    if (!isOpen || !selectedDeviceId || !videoRef.current) return;

    const codeReader = new BrowserMultiFormatReader();
    readerRef.current = codeReader;

    let stopped = false;

    codeReader
      .decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, _err, controls) => {

          if (stopped) return;
          controlsRef.current = controls;

          // Check for torch capability
          try {
            const stream = videoRef.current?.srcObject as MediaStream;
            const track = stream?.getVideoTracks()[0];
            const capabilities = track?.getCapabilities() as any;
            if (capabilities && capabilities.torch) {
              setHasTorch(true);
            }
          } catch {
            // Ignore
          }

          if (result) {
            const now = Date.now();
            const text = result.getText().trim();

            // Debounce same barcode within 1.5 seconds to avoid spamming
            if (text && (text !== lastScannedCode || now - lastScanTimeRef.current > 1500)) {
              lastScanTimeRef.current = now;
              sounds.playScanBeep();
              setLastScannedCode(text);
              onScan(text);

              if (!continuousMode) {
                controls.stop();
                onClose();
              }
            }
          }
        }
      )
      .catch((err) => {
        if (!stopped) {
          setErrorMsg(`Camera error: ${err.message || 'Failed to start video stream.'}`);
        }
      });

    return () => {
      stopped = true;
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
    };
  }, [isOpen, selectedDeviceId, continuousMode, lastScannedCode, onScan, onClose]);

  // Toggle Torch
  const toggleTorch = async () => {
    try {
      const stream = videoRef.current?.srcObject as MediaStream;
      const track = stream?.getVideoTracks()[0];
      if (track) {
        const nextTorch = !torchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextTorch } as any],
        });
        setTorchOn(nextTorch);
      }
    } catch {
      // Torch not supported
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-100">{title}</h3>
              <p className="text-xs text-slate-400">Point camera at UPC/EAN barcode or QR</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (controlsRef.current) controlsRef.current.stop();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Viewport */}
        <div className="relative aspect-4/3 w-full bg-black overflow-hidden flex items-center justify-center">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />

          {/* Barcode Targeting Reticle */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-8">
            <div className="relative w-3/4 max-w-[280px] h-48 border-2 border-emerald-400/70 rounded-xl overflow-hidden shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400"></div>

              {/* Animated Laser Scanning Line */}
              <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] animate-[bounce_2s_infinite]"></div>
            </div>
          </div>

          {/* Scanned Badge Popup */}
          {lastScannedCode && (
            <div className="absolute top-4 inset-x-4 flex items-center justify-center pointer-events-none">
              <div className="bg-emerald-600/90 text-white text-xs px-4 py-2 rounded-full font-mono flex items-center gap-2 shadow-lg backdrop-blur">
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>Scanned: <strong>{lastScannedCode}</strong></span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center">
              <div className="p-3 bg-rose-500/20 text-rose-400 rounded-full mb-3">
                <Camera className="w-8 h-8" />
              </div>
              <p className="text-sm text-rose-300 font-medium mb-1">Camera Access Issue</p>
              <p className="text-xs text-slate-400 max-w-xs mb-4">{errorMsg}</p>
              <button
                onClick={() => {
                  setErrorMsg(null);
                  setSelectedDeviceId((prev) => prev);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs rounded-lg text-slate-200 flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry Camera
              </button>
            </div>
          )}
        </div>

        {/* Controls Footer */}
        <div className="p-4 bg-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-slate-800">
          {/* Camera switcher */}
          {devices.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Camera:</span>
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="bg-slate-800 text-slate-200 rounded px-2.5 py-1.5 border border-slate-700 outline-none text-xs"
              >
                {devices.map((device, idx) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Flashlight toggle */}
          {hasTorch && (
            <button
              onClick={toggleTorch}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition ${
                torchOn
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{torchOn ? 'Flash On' : 'Flash Off'}</span>
            </button>
          )}

          {/* Continuous scan checkbox */}
          <label className="flex items-center gap-2 cursor-pointer select-none ml-auto text-slate-300">
            <input
              type="checkbox"
              checked={continuousMode}
              onChange={(e) => setContinuousMode(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
            />
            <span>Continuous Scan (Keep Open)</span>
          </label>
        </div>
      </div>
    </div>
  );
};
