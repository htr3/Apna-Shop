import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { X, Camera, AlertTriangle } from "lucide-react";

interface BarcodeScannerProps {
  onDetect: (code: string) => void;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

/**
 * Full-screen camera barcode/QR scanner using ZXing. Works in the browser on
 * HTTPS (Vercel) or localhost, prefers the rear camera on phones, and offers a
 * manual-entry fallback when the camera is unavailable.
 */
export function BarcodeScanner({ onDetect, onClose, title = "Scan Barcode", subtitle }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  // Keep latest onDetect without restarting the camera stream.
  const onDetectRef = useRef(onDetect);
  onDetectRef.current = onDetect;

  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState("");

  useEffect(() => {
    let active = true;
    const reader = new BrowserMultiFormatReader();

    (async () => {
      try {
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: "environment" } },
          videoRef.current!,
          (result, _err, ctrl) => {
            if (result && active) {
              ctrl.stop();
              onDetectRef.current(result.getText());
            }
          }
        );
        if (!active) controls.stop();
        else controlsRef.current = controls;
      } catch (e: any) {
        setError(
          e?.name === "NotAllowedError"
            ? "Camera permission denied. Allow camera access or enter the code manually."
            : "Unable to start the camera. Enter the code manually below."
        );
      }
    })();

    return () => {
      active = false;
      controlsRef.current?.stop();
    };
  }, []);

  const submitManual = () => {
    const code = manual.trim();
    if (code) onDetect(code);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              {title}
            </h3>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error ? (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-[4/3]">
              <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="w-3/4 h-1/3 border-2 border-white/80 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]" />
              </div>
              <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-white/90">
                Point the camera at the barcode
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Or enter code manually</label>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitManual()}
                placeholder="Barcode number"
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                onClick={submitManual}
                disabled={!manual.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-50"
              >
                Use
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
