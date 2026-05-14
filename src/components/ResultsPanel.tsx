import React, { useEffect } from 'react';
import { GameStats } from '../types';
import { Activity, Clock, Target, Trophy, RotateCcw, Home } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ResultsPanelProps {
  stats: GameStats;
  onRetry: () => void;
  onHome: () => void;
}

export default function ResultsPanel({ stats, onRetry, onHome }: ResultsPanelProps) {
  useEffect(() => {
    if (stats.maxCombo >= 15) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
      }, 250);
      
      return () => clearInterval(interval);
    }
  }, [stats.maxCombo]);
  // Analysis logic
  const consistencyScore = React.useMemo(() => {
    if (stats.hitIntervals.length < 2) return 0;
    
    // Calculate variance of intervals
    const avg = stats.hitIntervals.reduce((a, b) => a + b, 0) / stats.hitIntervals.length;
    const variance = stats.hitIntervals.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / stats.hitIntervals.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower stdDev is better consistency. 
    // Say perfect < 100ms, terrible > 1000ms
    const score = Math.max(0, 100 - (stdDev / 10));
    return Math.min(100, score).toFixed(1);
  }, [stats.hitIntervals]);

  const styleText = React.useMemo(() => {
    if (stats.hits === 0) return '缺少经验';
    const backhandRatio = stats.backhandHits / stats.hits;
    if (backhandRatio > 0.7) return '反手大师';
    if (backhandRatio < 0.3) return '正手暴徒';
    return '六边形战士';
  }, [stats]);

  const levelText = React.useMemo(() => {
    const isFlawless = stats.drops === 0;
    const isHighCombo = stats.maxCombo >= 30;
    const isSuperCombo = stats.maxCombo >= 50;

    if (stats.score >= 120 && isFlawless) return 'P10 研发副总裁 (封神)';
    if (stats.score >= 80 && isSuperCombo) return 'P9 首席安全官 (绝对防御)';
    if (stats.maxCombo > 30 || stats.score >= 50) return 'P7 资深专家 (业务骨干)';
    if (stats.maxCombo > 15 || stats.score >= 20) return 'P5 高级工程师 (熟练工)';
    if (stats.maxCombo > 5 || stats.score >= 5) return 'P3 初级开发 (实习转正)';
    return '外包/实习生 (初入茅庐)';
  }, [stats.maxCombo, stats.score, stats.drops]);

  return (
    <div className="w-full bg-[#0A0A0A] border flex flex-col md:flex-row border-white/10 shadow-2xl text-white font-sans">
      
      {/* Left Panel: Core Stats */}
      <div className="flex-1 p-8 md:p-12 border-b md:border-b-0 md:border-r border-white/10 flex flex-col">
          <h2 className="text-[10px] tracking-[0.3em] font-bold text-white/30 uppercase mb-8">性能测试报告</h2>
          <div className="flex items-baseline gap-4 mb-12">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic text-[#CCFF00]">数据分析</h1>
          </div>
          
          <div className="flex flex-col mb-10 border-l-4 border-[#CCFF00] pl-6 py-2 bg-gradient-to-r from-[#CCFF00]/10 to-transparent">
              <span className="text-6xl md:text-7xl font-black italic tracking-tighter text-[#CCFF00] drop-shadow-[0_0_15px_rgba(204,255,0,0.3)]">{stats.score}</span>
              <span className="text-[12px] font-bold text-white/70 tracking-widest uppercase mt-2">综合评定得分 (Total Score)</span>
          </div>

          <div className="grid grid-cols-2 gap-y-12 gap-x-8 mb-auto">
            <div className="flex flex-col">
              <span className="text-4xl md:text-5xl font-black italic tracking-tighter">{stats.hits}</span>
              <span className="text-[10px] font-bold text-white/50 tracking-widest uppercase mt-2">完全有效接触数</span>
            </div>
            <div className="flex flex-col">
              <span className="text-4xl md:text-5xl font-black italic tracking-tighter text-white">{stats.maxCombo}</span>
              <span className="text-[10px] font-bold text-white/30 tracking-widest uppercase mt-2">最高连击</span>
            </div>
            <div className="flex flex-col">
              <span className="text-4xl md:text-5xl font-black italic tracking-tighter">{consistencyScore}<span className="text-lg text-white/50">%</span></span>
              <span className="text-[10px] font-bold text-white/30 tracking-widest uppercase mt-2">节奏稳定性</span>
            </div>
            <div className="flex flex-col">
              <span className="text-4xl md:text-5xl font-black italic tracking-tighter">{stats.duration}<span className="text-lg text-white/50">s</span></span>
              <span className="text-[10px] font-bold text-white/30 tracking-widest uppercase mt-2">服务存活时长</span>
            </div>
          </div>
          
          <div className="mt-12 flex flex-col sm:flex-row gap-4">
            <button 
              onClick={onRetry}
              className="flex-1 py-4 border border-[#CCFF00] text-[#CCFF00] text-sm font-black uppercase tracking-widest hover:bg-[#CCFF00] hover:text-black transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} />
              重新部署 (再来一次)
            </button>
            <button 
              onClick={onHome}
              className="flex-1 py-4 bg-white text-black text-sm font-black uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
            >
              <Home size={16} />
              返回控制面板
            </button>
          </div>
      </div>
      
      {/* Right Panel: Director's Insight */}
      <aside className="w-full md:w-80 bg-[#0F0F0F] p-8 md:p-12 flex flex-col">
        <h2 className="text-[10px] tracking-[0.3em] font-bold text-white/30 uppercase mb-8">技术复盘</h2>
        
        <div className="space-y-10 flex-1 flex flex-col">
           <div>
             <div className="flex justify-between text-xs mb-2 italic font-bold">
               <span className="text-white/50 uppercase tracking-widest text-[10px] flex-nowrap whitespace-nowrap">主要发力方</span>
               <span className="text-[#CCFF00] uppercase tracking-widest text-[10px] text-right ml-2">{styleText}</span>
             </div>
             <div className="h-2 border border-white/20 w-full p-[1px]">
                <div 
                  className="h-full bg-[#CCFF00]" 
                  style={{ width: `${stats.hits > 0 ? (stats.forehandHits / stats.hits) * 100 : 50}%` }}
                />
             </div>
             <div className="flex justify-between text-xs mt-2 text-white/40 font-mono">
               <span>正手:{stats.forehandHits}</span>
               <span>反手:{stats.backhandHits}</span>
             </div>
           </div>

           <div className="pt-8 border-t border-white/10">
              <div className="flex flex-col">
                 <span className="text-white/50 uppercase tracking-widest text-[10px] mb-2">当前职级预测</span>
                 <span className="font-bold italic text-xl text-white max-w-[200px] leading-tight">{levelText}</span>
              </div>
           </div>

           <div className="pt-8 border-t border-white/10">
              <p className="text-[10px] font-bold text-white/50 mb-4 uppercase tracking-tighter">总监点评</p>
              <p className="text-sm italic leading-relaxed text-white/80">
                {stats.drops === 0 ? 
                  `"0次宕机丢包，你的运行时处于完美状态，准备好应对真实的生产环境挑战吧。干得不错。"` :
                  `"检测到 ${stats.drops} 次非受迫性失误 (下网/出界)。我们必须优化你核心操作架构中的容错策略，加强肢体前置缓冲。"`
                }
              </p>
           </div>
           
           <div className="mt-auto bg-white p-4">
              <p className="text-black text-[10px] font-black uppercase mb-1">活跃度波形分析</p>
              <div className="flex gap-1 h-8 items-end">
                {stats.hitIntervals.length > 0 ? (
                  stats.hitIntervals.slice(-10).map((interval, i) => (
                    <div key={i} className="flex-1 bg-black" style={{ height: `${Math.min(100, Math.max(10, interval / 20))}%` }}></div>
                  ))
                ) : (
                  <div className="text-black text-xs font-mono h-full flex items-end">暂无数据</div>
                )}
              </div>
           </div>
        </div>
      </aside>
    </div>
  );
}

// Remove previously unused StatBox

