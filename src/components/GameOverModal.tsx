import React from 'react';
import { RotateCcw, Map, PlusCircle, AlertCircle, Coins } from 'lucide-react';
import { LevelConfig, PlayerProgress } from '../game/types.ts';
import { sounds } from '../game/audio.ts';

interface GameOverModalProps {
  level: LevelConfig;
  score: number;
  progress: PlayerProgress;
  remainingBubblesCount: number;
  starsCollected: number;
  onRetry: () => void;
  onAddShots: () => void;
  onOpenLevelMap: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  level,
  score,
  progress,
  remainingBubblesCount,
  starsCollected,
  onRetry,
  onAddShots,
  onOpenLevelMap,
}) => {
  const canAffordShots = progress.coins >= 50;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none">
      <div className="relative w-full max-w-sm bg-slate-900 border-2 border-rose-500/80 rounded-3xl p-6 shadow-[0_0_40px_rgba(244,63,94,0.35)] flex flex-col items-center text-center text-white overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-600/20 rounded-full blur-2xl pointer-events-none" />

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-black uppercase tracking-wider mb-2">
          <AlertCircle className="w-4 h-4" />
          <span>Out of Shots!</span>
        </div>

        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-200 via-pink-300 to-rose-400 drop-shadow-sm">
          LEVEL FAILED
        </h2>
        <p className="text-xs text-slate-300 mt-0.5">Stage {level.id} · {level.theme.name}</p>

        {/* Objective Progress Status */}
        <div className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl p-4 my-5 flex flex-col gap-2.5 text-xs text-left">
          <div className="flex items-center justify-between text-slate-300">
            <span>Mission Objective</span>
            <span className="font-bold text-slate-100">{level.objective.description}</span>
          </div>

          {level.objective.type === 'collectStars' && (
            <div className="flex items-center justify-between text-slate-300">
              <span>Stars Gathered</span>
              <span className="font-mono font-bold text-amber-300">
                {starsCollected} / {level.objective.targetCount || 3}
              </span>
            </div>
          )}

          {level.objective.type === 'clearAll' && (
            <div className="flex items-center justify-between text-slate-300">
              <span>Bubbles Remaining</span>
              <span className="font-mono font-bold text-rose-400">{remainingBubblesCount}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-slate-300">
            <span>Final Score</span>
            <span className="font-mono font-bold text-white text-sm">{score.toLocaleString()}</span>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="w-full flex flex-col gap-2.5">
          {/* Continue with +5 shots */}
          <button
            onClick={() => {
              if (canAffordShots) {
                sounds.playCoin();
                onAddShots();
              } else {
                sounds.playClick();
              }
            }}
            disabled={!canAffordShots}
            className={`w-full py-3 px-4 rounded-xl font-black text-sm tracking-wide flex items-center justify-center gap-2 border transition active:scale-95 ${
              canAffordShots
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 text-slate-950 border-amber-300 shadow-[0_4px_15px_rgba(245,158,11,0.3)]'
                : 'bg-slate-800/60 text-slate-500 border-slate-700 cursor-not-allowed'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Continue with +5 Shots</span>
            <span className="flex items-center gap-0.5 ml-1 bg-black/20 px-2 py-0.5 rounded-full text-xs">
              <Coins className="w-3.5 h-3.5 text-amber-900" /> 50
            </span>
          </button>

          {/* Try Again */}
          <button
            data-start="true"
            onClick={() => {
              sounds.playClick();
              onRetry();
            }}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:brightness-110 text-white font-black text-base uppercase tracking-wide shadow-[0_4px_20px_rgba(244,63,94,0.4)] flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Try Again</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onOpenLevelMap();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <Map className="w-4 h-4 text-amber-400" />
            <span>Adventure Map</span>
          </button>
        </div>
      </div>
    </div>
  );
};
