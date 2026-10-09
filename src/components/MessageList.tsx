import React, { useEffect, useRef } from 'react';
import { Lock, Radio, ShieldCheck, QrCode } from 'lucide-react';
import { ChatMessage, GroupChannel } from '../types';

interface MessageListProps {
  messages: ChatMessage[];
  currentPeerId: string;
  activeGroup: GroupChannel;
  onOpenQR: () => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentPeerId,
  activeGroup,
  onOpenQR,
}) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {/* Channel Header Info Banner */}
      <div className="p-3.5 rounded-xl bg-[#11141c]/60 border border-slate-800/80 text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start sm:items-center gap-2.5">
          {activeGroup.isDirectBroadcast ? (
            <div className="w-7 h-7 rounded-lg bg-amber-950/60 border border-amber-800/40 flex items-center justify-center text-amber-400 shrink-0">
              <Radio className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
          )}
          <div>
            <div className="font-semibold text-white flex items-center gap-2">
              <span>{activeGroup.name}</span>
              {activeGroup.isDirectBroadcast ? (
                <span className="text-[10px] text-amber-400 font-mono">UNENCRYPTED BROADCAST</span>
              ) : (
                <span className="text-[10px] text-emerald-400 font-mono">AES-256-GCM VERIFIED</span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {activeGroup.isDirectBroadcast
                ? 'Visible to all nearby listening radio nodes. Zero encryption.'
                : 'Zero-server encrypted group. Only participants who scanned the QR key can decrypt.'}
            </p>
          </div>
        </div>

        {!activeGroup.isDirectBroadcast && (
          <button
            onClick={onOpenQR}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-400" />
            <span>Show Group QR</span>
          </button>
        )}
      </div>

      {/* Message Feed */}
      {messages.length === 0 ? (
        <div className="py-16 text-center text-slate-400 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
            {activeGroup.isDirectBroadcast ? (
              <Radio className="w-5 h-5 text-amber-400" />
            ) : (
              <Lock className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          <p className="text-sm font-semibold text-slate-200">No transmissions yet</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeGroup.isDirectBroadcast
              ? 'Send a beacon to broadcast a plain radio message to all devices in wireless range.'
              : 'Share the group QR code with nearby peers to begin encrypted P2P messaging.'}
          </p>
        </div>
      ) : (
        messages.map((msg) => {
          const isMe = msg.senderPeerId === currentPeerId || msg.isOutgoing;
          const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              {/* Sender Name & Unboxed Metadata */}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1 px-1 font-mono">
                <span className="font-semibold text-slate-300">
                  {isMe ? 'You' : msg.senderName}
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-500">{timeStr}</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-500">{msg.packetBytes} B</span>
                {msg.hopCount > 1 && (
                  <>
                    <span className="text-slate-600">·</span>
                    <span className="text-emerald-500/80">{msg.hopCount} hops</span>
                  </>
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[70%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMe
                    ? 'bg-emerald-600 text-white rounded-br-xs shadow-md'
                    : 'bg-[#151922] text-slate-100 border border-slate-800 rounded-bl-xs'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.text}</p>
              </div>

              {/* Verified Tag */}
              <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1 px-1 font-mono">
                {msg.isEncrypted ? (
                  <>
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>AES-256 Hardware Decrypted</span>
                  </>
                ) : (
                  <>
                    <Radio className="w-3 h-3 text-amber-400" />
                    <span>Cleartext Radio Broadcast</span>
                  </>
                )}
              </div>
            </div>
          );
        })
      )}

      <div ref={bottomRef} />
    </div>
  );
};
