import React from 'react';
import { Play, RotateCcw, Map, Home, Volume2, VolumeX } from 'lucide-react';
import { sounds } from '../game/audio.ts';

interface PauseModalProps {
  levelId: number;
  worldName: string;
  isMuted: boolean;
  onResume: () => void;
  onRestart: () => void;
  onOpenLevelMap: () => void;
  onExitTitle: () => void;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  levelId,
  worldName,
  isMuted,
  onResume,
  onRestart,
  onOpenLevelMap,
  onExitTitle,
  onToggleMute,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none">
      <div className="relative w-full max-w-xs bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center text-white overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <h2 className="text-2xl font-black text-white tracking-wide mb-1">GAME PAUSED</h2>
        <p className="text-xs text-slate-400 mb-6">Stage {levelId} · {worldName}</p>

        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={() => {
              sounds.playClick();
              onResume();
            }}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-slate-950 font-black text-base uppercase tracking-wide flex items-center justify-center gap-2 transition active:scale-95 shadow-lg"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Resume Game</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onRestart();
            }}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 flex items-center justify-center gap-2 transition active:scale-95"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span>Restart Level</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onOpenLevelMap();
            }}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Map className="w-4 h-4 text-amber-400" />
            <span>Adventure Map</span>
          </button>

          <div className="flex gap-2 mt-1">
            <button
              onClick={() => {
                sounds.playClick();
                onToggleMute();
              }}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700/80 flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
              <span>{isMuted ? 'Muted' : 'Sound ON'}</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                onExitTitle();
              }}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700/80 flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Home className="w-4 h-4 text-purple-400" />
              <span>Title</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
