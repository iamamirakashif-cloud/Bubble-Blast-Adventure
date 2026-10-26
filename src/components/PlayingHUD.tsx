import React from 'react';
import { Pause, Volume2, VolumeX, Sparkles, Bomb, Repeat, Flame, Zap, Target } from 'lucide-react';
import { BoosterType, LevelConfig, PlayerProgress } from '../game/types.ts';
import { sounds } from '../game/audio.ts';

interface PlayingHUDProps {
  level: LevelConfig;
  score: number;
  remainingShots: number;
  starsCollected: number;
  remainingBubblesCount: number;
  activeBooster: BoosterType | null;
  progress: PlayerProgress;
  isMuted: boolean;
  onPause: () => void;
  onToggleMute: () => void;
  onActivateBooster: (booster: BoosterType) => void;
  onSwapBubble: () => void;
}

export const PlayingHUD: React.FC<PlayingHUDProps> = ({
  level,
  score,
  remainingShots,
  starsCollected,
  remainingBubblesCount,
  activeBooster,
  progress,
  isMuted,
  onPause,
  onToggleMute,
  onActivateBooster,
  onSwapBubble,
}) => {
  // Star progress calculation
  const star1 = level.starScores[0];
  const star2 = level.starScores[1];
  const star3 = level.starScores[2];
  const starProgressPercent = Math.min(100, Math.round((score / star3) * 100));

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-4 select-none z-20">
      {/* Top Bar HUD */}
      <div className="w-full max-w-lg mx-auto flex flex-col gap-2 pointer-events-auto">
        <div className="flex items-center justify-between bg-slate-950/80 border border-slate-700/70 rounded-2xl p-2.5 px-3.5 shadow-xl backdrop-blur-sm">
          {/* Level & Objective */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400">
                Lvl {level.id}
              </span>
              <span className="text-slate-400 text-xs">·</span>
              <span className="text-xs font-semibold text-slate-300 truncate max-w-[120px] sm:max-w-[180px]">
                {level.theme.name}
              </span>
            </div>
            <div className="text-xs font-bold text-amber-300 flex items-center gap-1">
              {level.objective.type === 'collectStars' && (
                <>
                  <span>Stars:</span>
                  <span className="text-white">{starsCollected} / {level.objective.targetCount || 3}</span>
                </>
              )}
              {level.objective.type === 'reachScore' && (
                <>
                  <span>Target:</span>
                  <span className="text-white">{score} / {level.objective.targetCount?.toLocaleString()}</span>
                </>
              )}
              {level.objective.type === 'clearAll' && (
                <>
                  <span>Bubbles:</span>
                  <span className="text-white">{remainingBubblesCount}</span>
                </>
              )}
            </div>
          </div>

          {/* Score Counter */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">SCORE</span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight leading-none drop-shadow-sm">
              {score.toLocaleString()}
            </span>
          </div>

          {/* Remaining Shots Orb */}
          <div className="flex items-center gap-2">
            <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl border-2 shadow-inner transition ${
              remainingShots <= 5
                ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
                : 'bg-indigo-950/80 border-cyan-400 text-cyan-300'
            }`}>
              <span className="text-[9px] font-black leading-none uppercase">SHOTS</span>
              <span className="text-lg font-black leading-tight">{remainingShots}</span>
            </div>

            {/* Utility Buttons */}
            <div className="flex flex-col gap-1">
              <button
                onClick={() => {
                  sounds.playClick();
                  onPause();
                }}
                aria-label="Pause game"
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition active:scale-95 border border-slate-700"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  onToggleMute();
                }}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition active:scale-95 border border-slate-700"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
              </button>
            </div>
          </div>
        </div>

        {/* Star Progress Bar */}
        <div className="relative w-full h-2.5 bg-slate-900/90 rounded-full overflow-hidden border border-slate-800 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-amber-400 to-yellow-300 transition-all duration-300 rounded-full"
            style={{ width: `${starProgressPercent}%` }}
          />
          {/* Star Threshold pips */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white/60 -ml-0.5"
            style={{ left: `${Math.round((star1 / star3) * 100)}%` }}
            title="1 Star"
          />
          <div
            className="absolute top-0 bottom-0 w-1 bg-white/60 -ml-0.5"
            style={{ left: `${Math.round((star2 / star3) * 100)}%` }}
            title="2 Stars"
          />
        </div>
      </div>

      {/* Bottom Control Bar / Boosters Dock */}
      <div className="w-full max-w-sm mx-auto flex items-center justify-between gap-2 pointer-events-auto bg-slate-950/80 border border-slate-700/60 p-2 px-3 rounded-2xl shadow-2xl backdrop-blur-md">
        {/* Color Swap */}
        <button
          onClick={() => {
            sounds.playClick();
            onSwapBubble();
          }}
          aria-label="Swap current bubble"
          className="flex flex-col items-center gap-0.5 p-1.5 px-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 active:scale-95 transition"
        >
          <Repeat className="w-5 h-5 text-sky-400" />
          <span className="text-[10px] font-bold">Swap</span>
        </button>

        {/* Aim Extender Booster */}
        <button
          onClick={() => {
            sounds.playClick();
            onActivateBooster('aimExtender');
          }}
          aria-label="Toggle laser aim guide"
          className={`flex flex-col items-center gap-0.5 p-1.5 px-2 rounded-xl border transition active:scale-95 ${
            activeBooster === 'aimExtender'
              ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400'
              : 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200'
          }`}
        >
          <Target className="w-5 h-5 text-cyan-400" />
          <span className="text-[10px] font-bold">Laser</span>
        </button>

        {/* Bomb Booster */}
        <button
          onClick={() => {
            sounds.playClick();
            onActivateBooster('bomb');
          }}
          aria-label="Equip bomb shot"
          className={`flex flex-col items-center gap-0.5 p-1.5 px-2 rounded-xl border transition active:scale-95 ${
            activeBooster === 'bomb'
              ? 'bg-rose-500/30 border-rose-500 text-rose-300 ring-1 ring-rose-400'
              : 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200'
          }`}
        >
          <Bomb className="w-5 h-5 text-rose-400" />
          <span className="text-[10px] font-bold">Bomb</span>
        </button>

        {/* Rainbow Booster */}
        <button
          onClick={() => {
            sounds.playClick();
            onActivateBooster('rainbow');
          }}
          aria-label="Equip rainbow wild bubble"
          className={`flex flex-col items-center gap-0.5 p-1.5 px-2 rounded-xl border transition active:scale-95 ${
            activeBooster === 'rainbow'
              ? 'bg-amber-500/30 border-amber-400 text-amber-300 ring-1 ring-amber-400'
              : 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200'
          }`}
        >
          <Sparkles className="w-5 h-5 text-amber-300" />
          <span className="text-[10px] font-bold">Rainbow</span>
        </button>
      </div>
    </div>
  );
};
