import React, { useEffect, useRef, useState } from 'react';
import { GameMode, GameStats } from '../types';

interface BadmintonGameProps {
  mode: GameMode;
  onGameOver: (stats: GameStats) => void;
  onBack: () => void;
}

const GRAVITY = 0.25;
const AIR_RESISTANCE = 0.98; // Shuttlecock drag
const RACKET_WIDTH = 80;
const RACKET_HEIGHT = 10;
const SHUTTLECOCK_RADIUS = 8;
const MAX_FALL_SPEED = 7;

interface Shuttlecock {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  active: boolean;
}

interface Racket {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isBackhand: boolean;
}

export default function BadmintonGame({ mode, onGameOver, onBack }: BadmintonGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();
  const [timeLeft, setTimeLeft] = useState(mode === 'timed' ? 60 : 0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);

  // Mutable game state to avoid dependency issues in animation loop
  const gameState = useRef({
    shuttlecock: { x: 300, y: 100, vx: 0, vy: 0, rotation: 0, active: true } as Shuttlecock,
    racket: { x: 300, y: 500, vx: 0, vy: 0, isBackhand: false } as Racket,
    prevMouseLocation: { x: 300, y: 500 },
    stats: {
      hits: 0,
      maxCombo: 0,
      duration: 0,
      hitIntervals: [] as number[],
      drops: 0,
      heightsSum: 0,
      backhandHits: 0,
      forehandHits: 0,
    },
    lastHitTime: Date.now(),
    startTime: Date.now(),
    score: 0,
    combo: 0,
    particles: [] as { x: number, y: number, vx: number, vy: number, life: number }[],
    dimensions: { width: 800, height: 600 }
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      gameState.current.dimensions = { width: rect.width, height: rect.height };
      
      // Reset shuttlecock if it's out of bounds after resize
      if (gameState.current.shuttlecock.x > rect.width) {
        gameState.current.shuttlecock.x = rect.width / 2;
      }
    };

    window.addEventListener('resize', resize);
    resize();
    return () => window.removeEventListener('resize', resize);
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const state = gameState.current;
    
    // Calculate racket velocity
    state.racket.vx = x - state.prevMouseLocation.x;
    state.racket.vy = y - state.prevMouseLocation.y;
    
    state.racket.x = x;
    state.racket.y = y;
    
    state.prevMouseLocation = { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // 0 is left button (Forehand), 2 is right button (Backhand)
    if (e.button === 0) {
      gameState.current.racket.isBackhand = false;
    } else if (e.button === 2) {
      gameState.current.racket.isBackhand = true;
    }
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const createParticles = (x: number, y: number) => {
    const state = gameState.current;
    for(let i=0; i<5; i++) {
      state.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        life: 1.0
      });
    }
  };

  const updatePhysics = () => {
    const state = gameState.current;
    const s = state.shuttlecock;
    const r = state.racket;
    const dim = state.dimensions;

    // Apply gravity & drag to shuttlecock
    s.vy += GRAVITY;
    
    // Asymmetric drag: falls straight down eventually like a real shuttlecock
    s.vx *= AIR_RESISTANCE; 
    // vertical drag is less when falling, more when rising to simulate the skirt flipping
    if (s.vy > 0) {
       s.vy *= 0.96; // Increased drag when falling (parachute effect)
       if (s.vy > MAX_FALL_SPEED) s.vy = MAX_FALL_SPEED;
    } else {
       s.vy *= 0.98; // Slightly less drag rising so it feels responsive
    }

    s.x += s.vx;
    s.y += s.vy;
    
    // Calculate rotation based on velocity trajectory (skirt follows head)
    if (Math.abs(s.vx) > 0.1 || Math.abs(s.vy) > 0.1) {
       s.rotation = Math.atan2(s.vy, s.vx) + Math.PI / 2;
    }

    // Wall bounces (light)
    if (s.x < SHUTTLECOCK_RADIUS) {
      s.x = SHUTTLECOCK_RADIUS;
      s.vx *= -0.5;
    } else if (s.x > dim.width - SHUTTLECOCK_RADIUS) {
      s.x = dim.width - SHUTTLECOCK_RADIUS;
      s.vx *= -0.5;
    }

    // Collision detection with Racket
    // Simulate racket as a broader surface since it's an ellipse now
    const racketHitboxY = r.y;
    const racketLeft = r.x - RACKET_WIDTH / 2;
    const racketRight = r.x + RACKET_WIDTH / 2;

    // Expand Hitbox Y to match the ellipse visual (radius Y approx 50)
    if (s.vy > 0 && s.y + SHUTTLECOCK_RADIUS >= racketHitboxY - 30 && s.y - SHUTTLECOCK_RADIUS <= racketHitboxY + 50) {
      if (s.x >= racketLeft - 20 && s.x <= racketRight + 20) {
        
        // Hit!
        const hitTime = Date.now();
        const interval = hitTime - state.lastHitTime;
        if (state.score > 0 && interval < 5000) {
           state.stats.hitIntervals.push(interval);
        }
        state.lastHitTime = hitTime;
        
        state.score += 1;
        state.combo += 1;
        state.stats.hits += 1;
        if (state.combo > state.stats.maxCombo) {
          state.stats.maxCombo = state.combo;
        }
        
        if (r.isBackhand) state.stats.backhandHits++;
        else state.stats.forehandHits++;

        // Physics reaction
        // Base bounce + Racket upward velocity contribution
        // Ensure minimum bounce so it doesn't just sit on the racket
        const upwardForce = Math.max(6, -r.vy * 0.4 + 8); 
        s.vy = -upwardForce;
        
        // Horizontal force based on where it hit the racket and racket horizontal move
        const hitOffset = (s.x - r.x) / (RACKET_WIDTH / 2); // -1 to 1
        s.vx = hitOffset * 4 + r.vx * 0.3;
        
        // Push slightly above racket to prevent double hit
        s.y = racketHitboxY - SHUTTLECOCK_RADIUS - 5;
        
        // Record height
        state.stats.heightsSum += (dim.height - s.y);

        createParticles(s.x, s.y);

        setScore(state.score);
        setCombo(state.combo);
      }
    }

    // Dropped shuttlecock
    if (s.y > dim.height + 50) {
      state.stats.drops += 1;
      state.combo = 0;
      setCombo(0);
      
      // Respawn
      s.y = -50;
      s.x = Math.max(50, Math.min(dim.width - 50, r.x));
      s.vy = 0;
      s.vx = (Math.random() - 0.5) * 4;
    }

    // Update particles
    state.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.05;
    });
    state.particles = state.particles.filter(p => p.life > 0);
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const state = gameState.current;
    const dim = state.dimensions;
    ctx.clearRect(0, 0, dim.width, dim.height);

    // Draw Particles
    state.particles.forEach(p => {
      ctx.fillStyle = `rgba(200, 255, 255, ${p.life})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Canvas drawing logic updates for theme
    const r = state.racket;
    ctx.save();
    ctx.translate(r.x, r.y);
    
    // Tilt racket slightly based on horizontal movement
    ctx.rotate(r.vx * 0.02);
    
    // Racket style changes based on forehand/backhand
    const racketColor = r.isBackhand ? '#FF3366' : '#CCFF00'; 
    const racketGlow = r.isBackhand ? 'rgba(255, 51, 102, 0.4)' : 'rgba(204, 255, 0, 0.4)';
    
    ctx.shadowBlur = 15;
    ctx.shadowColor = racketGlow;
    
    // Draw Racket Shaft
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 45); 
    ctx.lineTo(0, 120); 
    ctx.stroke();

    // Draw T-Joint
    ctx.fillStyle = '#444';
    ctx.beginPath();
    ctx.moveTo(-6, 45);
    ctx.lineTo(6, 45);
    ctx.lineTo(8, 55);
    ctx.lineTo(3, 60);
    ctx.lineTo(-3, 60);
    ctx.lineTo(-8, 55);
    ctx.closePath();
    ctx.fill();

    // Draw Racket Handle
    ctx.shadowBlur = 0; // No glow for handle
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.roundRect(-8, 120, 16, 60, 4);
    ctx.fill();
    // Grip tape lines
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 125; i < 175; i += 8) {
      ctx.moveTo(-8, i);
      ctx.lineTo(8, i + 4);
    }
    ctx.stroke();

    // Restore glow for head
    ctx.shadowBlur = 15;
    
    // Draw Racket Head Frame
    ctx.strokeStyle = racketColor;
    ctx.lineWidth = 6;
    ctx.beginPath();
    // Ellipse for racket head: radius X is 40 (width 80), radius Y is 50
    ctx.ellipse(0, 0, 40, 50, 0, 0, Math.PI * 2);
    ctx.stroke();
    
    // Racket string bed texture via clipping
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 0, 37, 47, 0, 0, Math.PI * 2);
    ctx.clip();
    
    ctx.strokeStyle = r.isBackhand ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    for(let y = -50; y <= 50; y += 8) {
       ctx.moveTo(-40, y);
       ctx.lineTo(40, y);
    }
    for(let x = -40; x <= 40; x += 8) {
       ctx.moveTo(x, -50);
       ctx.lineTo(x, 50);
    }
    ctx.stroke();
    
    // Tint the string bed slightly
    ctx.fillStyle = r.isBackhand ? 'rgba(255, 51, 102, 0.1)' : 'rgba(204, 255, 0, 0.1)';
    ctx.fill();
    ctx.restore(); // Undo clip

    ctx.restore();

    // Draw Shuttlecock
    const s = state.shuttlecock;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rotation);

    // Shuttlecock head (cork)
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(0, 0, SHUTTLECOCK_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Shuttlecock skirt (feathers)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.moveTo(-SHUTTLECOCK_RADIUS + 2, 2);
    ctx.lineTo(-SHUTTLECOCK_RADIUS - 12, -25);
    ctx.lineTo(SHUTTLECOCK_RADIUS + 12, -25);
    ctx.lineTo(SHUTTLECOCK_RADIUS - 2, 2);
    ctx.closePath();
    ctx.fill();
    
    // Skirt details
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -5); ctx.lineTo(0, -25);
    ctx.moveTo(-5, -3); ctx.lineTo(-8, -25);
    ctx.moveTo(5, -3); ctx.lineTo(8, -25);
    ctx.stroke();

    ctx.restore();
  };

  const gameLoop = () => {
    updatePhysics();
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) draw(ctx);
    }
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Timer logic for timed mode
  useEffect(() => {
    if (mode === 'timed') {
      const interval = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(interval);
            endGame();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [mode]);

  const endGame = () => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    const state = gameState.current;
    const finalStats: GameStats = {
      hits: state.stats.hits,
      maxCombo: state.stats.maxCombo,
      duration: mode === 'timed' ? 60 : Math.floor((Date.now() - state.startTime) / 1000),
      hitIntervals: state.stats.hitIntervals,
      drops: state.stats.drops,
      avgHeight: state.stats.hits > 0 ? state.stats.heightsSum / state.stats.hits : 0,
      backhandHits: state.stats.backhandHits,
      forehandHits: state.stats.forehandHits,
    };
    onGameOver(finalStats);
  };

  return (
    <div className="absolute inset-0 w-full h-full flex flex-col">
      {/* Header / HUD Overlay */}
      <div className="absolute top-6 md:top-10 left-6 md:left-10 flex gap-4 pointer-events-none z-10">
        <div className="px-4 py-2 bg-black/50 border border-white/20 backdrop-blur-md">
          <p className="text-[10px] text-white/50 uppercase font-bold tracking-widest">当前绩效</p>
          <p className="text-2xl md:text-3xl font-black italic tracking-tighter text-white">{score}</p>
        </div>
        <div className="px-4 py-2 bg-black/50 border border-white/20 backdrop-blur-md">
          <p className="text-[10px] text-white/50 uppercase font-bold tracking-widest">连续输出</p>
          <p className={`text-2xl md:text-3xl font-black italic tracking-tighter ${combo > 5 ? 'text-[#CCFF00]' : 'text-white/80'}`}>x{combo}</p>
        </div>
      </div>

      <div className="absolute top-6 right-6 md:top-10 md:right-10 flex flex-col items-end gap-2 z-10">
           {mode === 'timed' && (
             <div className="px-4 py-2 bg-black/50 border border-white/20 backdrop-blur-md text-right mb-2">
               <p className="text-[10px] text-white/50 uppercase font-bold tracking-widest">剩余时间</p>
               <p className={`text-2xl md:text-3xl font-black italic tracking-tighter ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-[#CCFF00]'}`}>
                 {timeLeft}s
               </p>
             </div>
           )}
           <button 
             onClick={endGame}
             className="pointer-events-auto px-4 py-2 border border-white/20 bg-black/50 hover:bg-white hover:text-black transition-colors backdrop-blur-md text-xs font-bold uppercase tracking-widest text-white/80"
           >
             结束评估
           </button>
      </div>

      <div className="flex-1 cursor-crosshair touch-none w-full h-full" ref={containerRef}>
        <canvas
          ref={canvasRef}
          onContextMenu={(e) => e.preventDefault()}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="block touch-none"
        />
      </div>
    </div>
  );
}
