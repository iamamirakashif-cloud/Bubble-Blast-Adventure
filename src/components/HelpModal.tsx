import React from 'react';
import { X, Target, Sparkles, Bomb, Zap, Flame, Shield, HelpCircle } from 'lucide-react';
import { sounds } from '../game/audio.ts';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md select-none">
      <div className="relative w-full max-w-md max-h-[85vh] bg-slate-900 border border-slate-700/80 rounded-3xl p-5 shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-black text-white">How to Play</h2>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            aria-label="Close help"
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs pr-1">
          {/* Section 1: Core Aim & Shoot */}
          <div className="bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800/80">
            <h3 className="font-bold text-sm text-cyan-300 flex items-center gap-1.5 mb-1.5">
              <Target className="w-4 h-4 text-cyan-400" />
              Aiming & Shooting
            </h3>
            <p className="text-slate-300 leading-relaxed">
              • <strong>Hold & Drag:</strong> Touch or click the screen and drag to aim the launcher. The guideline shows where the bubble will go.
            </p>
            <p className="text-slate-300 leading-relaxed mt-1">
              • <strong>Wall Ricochet:</strong> Bounce bubbles off the left and right walls to reach tricky clusters!
            </p>
            <p className="text-slate-300 leading-relaxed mt-1">
              • <strong>Match 3+:</strong> Connect 3 or more bubbles of the same color to burst them. Disconnected bubbles fall down for big bonus points!
            </p>
          </div>

          {/* Section 2: Special Bubbles */}
          <div className="bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800/80">
            <h3 className="font-bold text-sm text-amber-300 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Special Bubbles
            </h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-slate-800 border border-rose-500/80 flex items-center justify-center shrink-0 mt-0.5">
                  <Bomb className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <div>
                  <span className="font-bold text-rose-300">Bomb Bubble:</span>
                  <span className="text-slate-300 ml-1">Detonates on contact, clearing all bubbles within a 2-radius shockwave!</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-slate-800 border border-cyan-400/80 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-3.5 h-3.5 text-cyan-300" />
                </div>
                <div>
                  <span className="font-bold text-cyan-300">Lightning Bubble:</span>
                  <span className="text-slate-300 ml-1">Zaps an electric bolt straight across to destroy an entire row!</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-slate-800 border border-orange-500/80 flex items-center justify-center shrink-0 mt-0.5">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                </div>
                <div>
                  <span className="font-bold text-orange-300">Fire Bubble:</span>
                  <span className="text-slate-300 ml-1">Incinerates a dense cluster of neighboring bubbles!</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-slate-800 border border-amber-400/80 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                </div>
                <div>
                  <span className="font-bold text-amber-300">Rainbow Bubble:</span>
                  <span className="text-slate-300 ml-1">Wild bubble that automatically matches any adjacent color group!</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div>
                  <span className="font-bold text-slate-300">Stone Bubble:</span>
                  <span className="text-slate-300 ml-1">Indestructible obstacle. Dislodge it by popping the anchor above it or using a bomb!</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Boosters & Power-Ups */}
          <div className="bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800/80">
            <h3 className="font-bold text-sm text-emerald-300 flex items-center gap-1.5 mb-1.5">
              Power-Up Boosters
            </h3>
            <p className="text-slate-300 leading-relaxed">
              Use the bottom booster bar anytime during gameplay to activate the <strong>Laser Extender</strong>, load a <strong>Bomb Shot</strong>, arm a <strong>Rainbow Bubble</strong>, or <strong>Swap</strong> with your upcoming shot!
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition"
        >
          Got It!
        </button>
      </div>
    </div>
  );
};
