import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running standalone, hide
  if (isInstalled) {
    return null;
  }

  return (
    <>
      {isInstallable && (
        <button
          onClick={install}
          title="Install MChat for offline background operation"
          className={`flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/40 transition-colors whitespace-nowrap shrink-0 text-xs font-medium cursor-pointer ${
            compact ? 'px-2 py-1' : 'px-3 py-1.5'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>
      )}

      {isIOS && !isInstallable && (
        <button
          onClick={() => setShowIOSGuide(true)}
          title="Add to Home Screen for iOS offline mesh"
          className={`flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 text-xs font-medium cursor-pointer ${
            compact ? 'px-2 py-1' : 'px-3 py-1.5'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install iOS</span>
        </button>
      )}

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#11141c] border border-slate-800 p-5 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold tracking-wide text-white">Install MChat on iPhone / iPad</h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80">
                <Share2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">Step 1:</span> Tap the <strong className="text-emerald-400">Share</strong> icon in the Safari bottom toolbar.
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80">
                <PlusSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">Step 2:</span> Scroll down and tap <strong className="text-emerald-400">Add to Home Screen</strong>.
                </div>
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                Enables true offline execution, full-screen UI, and low-latency local background radios without Safari browser bars.
              </p>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full rounded-lg bg-slate-800 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};
