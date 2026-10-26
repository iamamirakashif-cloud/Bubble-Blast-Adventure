import React, { useState } from 'react';
import { X, Star, Lock, Play, ChevronLeft, ChevronRight, Award } from 'lucide-react';
import { PlayerProgress } from '../game/types.ts';
import { WORLDS, TOTAL_LEVELS } from '../game/levels.ts';
import { sounds } from '../game/audio.ts';

interface LevelSelectModalProps {
  progress: PlayerProgress;
  onSelectLevel: (levelId: number) => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  progress,
  onSelectLevel,
  onClose,
}) => {
  // Current active world tab (0 to 9)
  const initialWorld = Math.min(9, Math.floor((progress.unlockedLevel - 1) / 10));
  const [activeWorldIdx, setActiveWorldIdx] = useState(initialWorld);

  const activeWorld = WORLDS[activeWorldIdx] || WORLDS[0];
  const startLevelId = activeWorldIdx * 10 + 1;
  const endLevelId = Math.min(TOTAL_LEVELS, startLevelId + 9);
  const levelsInWorld = Array.from({ length: endLevelId - startLevelId + 1 }, (_, i) => startLevelId + i);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg h-[90vh] max-h-[680px] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-lg font-black tracking-wide text-white">Adventure Map</h2>
              <p className="text-xs text-slate-400">100 Levels across 10 Worlds</p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            aria-label="Close level map"
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* World Carousel Navigator */}
        <div className="px-4 py-3 bg-slate-950/30 border-b border-slate-800/80 flex items-center justify-between">
          <button
            disabled={activeWorldIdx === 0}
            onClick={() => {
              sounds.playClick();
              setActiveWorldIdx(prev => Math.max(0, prev - 1));
            }}
            aria-label="Previous world"
            className="p-1.5 rounded-lg bg-slate-800 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-700 text-white transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center px-2">
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              World {activeWorld.id} of 10
            </div>
            <div className="text-base font-black text-white">{activeWorld.name}</div>
            <div className="text-[11px] text-slate-400">{activeWorld.subtitle}</div>
          </div>

          <button
            disabled={activeWorldIdx === WORLDS.length - 1}
            onClick={() => {
              sounds.playClick();
              setActiveWorldIdx(prev => Math.min(WORLDS.length - 1, prev + 1));
            }}
            aria-label="Next world"
            className="p-1.5 rounded-lg bg-slate-800 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-700 text-white transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Level Grid Path */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-2 gap-3.5 content-start">
          {levelsInWorld.map((lvl) => {
            const isUnlocked = lvl <= progress.unlockedLevel;
            const stars = progress.levelStars[lvl] || 0;
            const isCurrent = lvl === progress.unlockedLevel;
            const highScore = progress.levelScores[lvl] || 0;

            return (
              <button
                key={lvl}
                disabled={!isUnlocked}
                onClick={() => {
                  sounds.playClick();
                  onSelectLevel(lvl);
                }}
                className={`relative p-3.5 rounded-2xl border transition text-left flex flex-col justify-between h-28 ${
                  isCurrent
                    ? 'bg-gradient-to-br from-indigo-950 to-slate-900 border-cyan-400 ring-2 ring-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                    : isUnlocked
                    ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 hover:border-slate-500 shadow-md'
                    : 'bg-slate-950/40 border-slate-800/60 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                      isCurrent
                        ? 'bg-cyan-400 text-slate-950'
                        : isUnlocked
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-900 text-slate-500'
                    }`}>
                      {lvl}
                    </span>
                    <span className="text-xs font-bold text-slate-200">Stage {lvl}</span>
                  </div>

                  {isUnlocked ? (
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3].map((starIdx) => (
                        <Star
                          key={starIdx}
                          className={`w-3.5 h-3.5 ${
                            starIdx <= stars
                              ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                              : 'text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                  ) : (
                    <Lock className="w-4 h-4 text-slate-500" />
                  )}
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px]">
                  {isUnlocked ? (
                    <>
                      <span className="text-slate-400">
                        {highScore > 0 ? `${highScore.toLocaleString()} pts` : 'Not played'}
                      </span>
                      <span className="text-cyan-400 font-bold flex items-center gap-1">
                        <Play className="w-3 h-3 fill-current" />
                        Play
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-500">Clear Level {lvl - 1} to unlock</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-950/60 border-t border-slate-800 text-center text-xs text-slate-400">
          World {activeWorld.id}: {activeWorld.name}
        </div>
      </div>
    </div>
  );
};
