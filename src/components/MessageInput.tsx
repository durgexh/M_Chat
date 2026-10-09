import React, { useState } from 'react';
import { Send, Volume2, VolumeX } from 'lucide-react';
import { isAudioEnabled, setAudioEnabled } from '../services/audio';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
  channelName: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
  channelName,
}) => {
  const [text, setText] = useState('');
  const [audioOn, setAudioOn] = useState(() => isAudioEnabled());

  const handleToggleAudio = () => {
    const next = !audioOn;
    setAudioOn(next);
    setAudioEnabled(next);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    onSendMessage(trimmed);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div className="border-t border-slate-800 bg-[#0a0c10]/95 backdrop-blur-md p-3 sm:p-4">
      <form onSubmit={handleSend} className="flex items-center gap-2">
        {/* Radio Audio Toggle */}
        <button
          type="button"
          onClick={handleToggleAudio}
          title={audioOn ? 'Mute radio squelch chirps' : 'Unmute radio squelch chirps'}
          className={`p-2 rounded-xl border border-slate-800 transition-colors cursor-pointer shrink-0 ${
            audioOn
              ? 'bg-slate-900 text-emerald-400 hover:bg-slate-800'
              : 'bg-slate-900/40 text-slate-500 hover:text-slate-300'
          }`}
        >
          {audioOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Input box */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={`Message ${channelName}...`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            maxLength={500}
            className="w-full pl-3.5 pr-12 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          {text.length > 400 && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">
              {500 - text.length}
            </span>
          )}
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!text.trim() || disabled}
          className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
          title="Transmit over local radio"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
