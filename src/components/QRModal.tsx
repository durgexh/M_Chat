import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { X, ShieldCheck, Copy, Check, Download, Share2 } from 'lucide-react';
import { GroupChannel } from '../types';
import { encodeGroupInvite } from '../services/crypto';

interface QRModalProps {
  group: GroupChannel;
  onClose: () => void;
}

export const QRModal: React.FC<QRModalProps> = ({ group, onClose }) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const inviteUri = encodeGroupInvite(group);

  useEffect(() => {
    // Generate QR code with high error correction and crisp contrast
    QRCode.toDataURL(inviteUri, {
      width: 320,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then(url => setDataUrl(url))
      .catch(err => console.error('Failed to generate QR code:', err));
  }, [inviteUri]);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `mchat-${group.name.replace(/\s+/g, '-').toLowerCase()}-qr.png`;
    a.click();
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `MChat Encrypted Group: ${group.name}`,
          text: `Scan or join this decentralized MChat group with AES-256 encryption:`,
          url: inviteUri,
        });
      } catch {
        // User dismissed
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-2xl bg-[#11141c] border border-slate-800 p-6 shadow-2xl text-slate-100 flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold tracking-wide text-white">Group Access QR</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Group Name & Encryption Spec */}
        <div className="text-center my-3">
          <h3 className="text-base font-bold text-white tracking-tight">{group.name}</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            AES-256-GCM · Serverless Zero-Knowledge Key
          </p>
        </div>

        {/* Crisp QR Code Frame */}
        <div className="p-3 bg-white rounded-xl shadow-inner border border-slate-300 my-2 flex items-center justify-center">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt="Scan QR to join encrypted group"
              className="w-56 h-56 sm:w-60 sm:h-60 block object-contain"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-xs text-slate-500 font-mono">
              Generating secure matrix...
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <p className="text-[11px] text-slate-400 text-center max-w-xs mt-1">
          Have participants scan this code on their Android or iOS device using MChat to securely import the channel key.
        </p>

        {/* Actions */}
        <div className="w-full grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/80">
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Key'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save QR</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};
