import React, { useState, useEffect } from 'react';
import BadmintonGame from './components/BadmintonGame';
import ResultsPanel from './components/ResultsPanel';
import BossKeyOverlay from './components/BossKeyOverlay';
import { GameMode, GameStats, INITIAL_STATS } from './types';
import { Play, Timer } from 'lucide-react';

type AppState = 'menu' | 'playing' | 'results';

export default function App() {
  const [appState, setAppState] = useState<AppState>('menu');
  const [mode, setMode] = useState<GameMode>('free');
  const [lastStats, setLastStats] = useState<GameStats>(INITIAL_STATS);
  const [bossKeyActive, setBossKeyActive] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setBossKeyActive(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const startGame = (selectedMode: GameMode) => {
    setMode(selectedMode);
    setAppState('playing');
  };

  const handleGameOver = (stats: GameStats) => {
    setLastStats(stats);
    setAppState('results');
  };

  return (
    <div className="h-screen bg-[#0A0A0A] text-white flex flex-col font-sans overflow-hidden">
      
      {bossKeyActive && <BossKeyOverlay />}

      {/* Header: Corporate Athlete Dashboard */}
      <header className="h-16 md:h-20 shrink-0 border-b border-white/10 flex items-center justify-between px-4 md:px-10 bg-[#0F0F0F] z-20 relative">
        <div className="flex items-baseline gap-4">
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase italic text-[#CCFF00]">TouchFish.OS</h1>
          <span className="hidden md:inline text-[10px] tracking-[0.2em] font-bold text-white/40 uppercase">带薪颠球评估系统</span>
        </div>
        <div className="flex gap-4 md:gap-8 items-center font-mono text-xs">
          <div className="flex flex-col items-end">
            <span className="text-white/40">系统状态</span>
            <span className="text-[#CCFF00]">准备就绪</span>
          </div>
          <div className="w-[1px] h-8 bg-white/10 hidden md:block"></div>
          <div className="flex flex-col items-end hidden md:flex">
            <span className="text-white/40">一键掩护 (老板键)</span>
            <span className="px-1 bg-white text-black font-bold">空格键 (SPACE)</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
      {appState === 'menu' && (
        <div className="flex-1 flex flex-col lg:flex-row w-full h-full">
          {/* Sidebar Menu */}
          <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-white/10 p-6 md:p-8 flex flex-col bg-[#0F0F0F] z-10 shrink-0">
             <h2 className="text-[10px] tracking-[0.3em] font-bold text-white/30 uppercase mb-8">系统模式</h2>
             <div className="space-y-4 flex flex-col">
               <button
                 onClick={() => startGame('timed')}
                 className="w-full py-4 bg-[#CCFF00] text-black text-sm font-black uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(204,255,0,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] order-1"
               >
                 <Timer size={16} /> 职级晋升抗压战 (60s)
               </button>
               <button
                 onClick={() => startGame('free')}
                 className="w-full py-4 border border-white/20 text-white/70 text-sm font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2 order-2"
               >
                 <Play size={16} /> 无尽自由摸鱼模式
               </button>
             </div>
             
             <div className="mt-8 md:mt-12">
                 <h2 className="text-[10px] tracking-[0.3em] font-bold text-white/30 uppercase mb-4">操作手册</h2>
                 <div className="p-4 border border-white/10 bg-black/50 text-xs font-mono text-white/50 leading-relaxed">
                   <p>移动鼠标以控制战术球拍接球。</p>
                   <p className="mt-2 text-[#CCFF00]">[鼠标左键] 切换至正手（绿色）。</p>
                   <p className="mt-1 text-[#FF3366]">[鼠标右键] 切换至反手（红色）。</p>
                   <p className="mt-4 italic border-t border-white/10 pt-2 text-white/30">提示：正反手交替可以有效提升连击得分，遇到主管请秒按 空格键 启动防御伪装。</p>
                 </div>
             </div>
          </aside>

          {/* Central Gameplay Area Background (Menu decorative) */}
          <section className="flex-1 relative bg-[radial-gradient(circle_at_center,_#1A1A1A_0%,_#0A0A0A_100%)] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#FFF 1px, transparent 1px), linear-gradient(90deg, #FFF 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
            
            <div className="flex flex-col items-center z-10 relative pointer-events-none">
               {/* Animated rotating outer rings */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-[1px] border-white/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-[2px] border-dashed border-[#CCFF00]/30 rounded-full animate-[spin_8s_linear_infinite_reverse]"></div>
               
               {/* Bouncing Shuttle */}
               <div className="w-16 h-20 animate-bounce z-20 mb-8 opacity-90 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                 <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                   {/* Feathers outline */}
                   <polygon points="20,20 80,20 60,70 40,70" fill="transparent" stroke="white" strokeWidth="4" strokeLinejoin="round" />
                   {/* Inner feather lines */}
                   <line x1="35" y1="20" x2="47" y2="70" stroke="white" strokeWidth="2" />
                   <line x1="50" y1="20" x2="50" y2="70" stroke="white" strokeWidth="2" />
                   <line x1="65" y1="20" x2="53" y2="70" stroke="white" strokeWidth="2" />
                   {/* Strings / Bands */}
                   <line x1="26" y1="38" x2="74" y2="38" stroke="white" strokeWidth="2" />
                   <line x1="33" y1="54" x2="67" y2="54" stroke="white" strokeWidth="2" />
                   {/* Cork */}
                   <path d="M 38 70 C 38 85, 62 85, 62 70 Z" fill="#CCFF00" />
                 </svg>
               </div>

               <span className="text-[60px] md:text-[90px] font-black leading-none tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 z-20 drop-shadow-[0_0_15px_rgba(204,255,0,0.1)]">
                 MOYU.EXE
               </span>
               <span className="text-[10px] md:text-xs tracking-[0.5em] font-bold uppercase mt-2 text-[#CCFF00] animate-pulse z-20">
                 防暂离协议激活 / System Ready
               </span>
            </div>
          </section>
        </div>
      )}

      {appState === 'playing' && (
        <div className="flex-1 relative bg-[radial-gradient(circle_at_center,_#1A1A1A_0%,_#0A0A0A_100%)] overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#FFF 1px, transparent 1px), linear-gradient(90deg, #FFF 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
          <BadmintonGame 
            mode={mode} 
            onGameOver={handleGameOver} 
            onBack={() => setAppState('menu')} 
          />
        </div>
      )}

      {appState === 'results' && (
        <div className="flex-1 relative bg-[radial-gradient(circle_at_center,_#1A1A1A_0%,_#0A0A0A_100%)] flex items-center justify-center p-4 md:p-10 overflow-auto">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#FFF 1px, transparent 1px), linear-gradient(90deg, #FFF 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
          <div className="z-10 w-full max-w-5xl">
            <ResultsPanel 
              stats={lastStats} 
              onRetry={() => startGame(mode)} 
              onHome={() => setAppState('menu')} 
            />
          </div>
        </div>
      )}
      </main>

      {/* Footer: System Ticker */}
      <footer className="h-12 shrink-0 border-t border-white/10 bg-black flex items-center px-4 md:px-10 overflow-hidden relative z-20">
        <div className="flex gap-8 md:gap-12 text-[10px] font-mono whitespace-nowrap animate-pulse">
          <span className="text-white/40">系统日志: <span className="text-white italic">物理引擎已挂载</span></span>
          <span className="text-white/40">内存占用: <span className="text-[#CCFF00] italic">已优化</span></span>
          <span className="text-white/40">远程服务器: <span className="text-white italic">连接生产环境</span></span>
          <span className="text-white/40">摸鱼风险判定: <span className="text-red-500 italic">规避主管模式</span></span>
        </div>
      </footer>
      
    </div>
  );
}
