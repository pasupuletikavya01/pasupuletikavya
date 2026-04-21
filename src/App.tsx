/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Circle,
  Activity,
  Terminal,
  Cpu,
  Layers,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

interface Position {
  x: number;
  y: number;
}

interface Track {
  id: number;
  title: string;
  artist: string;
  url: string;
  type: string;
  duration: string;
}

// --- Constants ---

const GRID_SIZE = 20;
const INITIAL_SNAKE: Position[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const TICK_RATE = 120;

const TRACKS: Track[] = [
  {
    id: 1,
    title: "NEON_DREAMS.WAV",
    artist: "NEURAL SYNTH",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    type: "BITRATE: 320KBPS",
    duration: "4:21"
  },
  {
    id: 2,
    title: "CIRCUIT_BREAKER.MP3",
    artist: "AETHER AI",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    type: "BITRATE: 256KBPS",
    duration: "3:45"
  },
  {
    id: 3,
    title: "VOID_WALKER_VOX.AI",
    artist: "DIGITAL GHOST",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    type: "BITRATE: 320KBPS",
    duration: "5:12"
  },
];

// --- Components ---

function SnakeGame({ onScoreUpdate, isPaused, setIsPaused }: { 
  onScoreUpdate: (score: number) => void,
  isPaused: boolean,
  setIsPaused: (val: boolean) => void 
}) {
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Position>(INITIAL_DIRECTION);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  const generateFood = useCallback((currentSnake: Position[]) => {
    let newFood: Position;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      if (!currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
        break;
      }
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood({ x: 5, y: 5 });
    setIsGameOver(false);
    setIsPaused(true);
    setScore(0);
    onScoreUpdate(0);
  };

  const moveSnake = useCallback(() => {
    if (isPaused || isGameOver) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = {
        x: head.x + direction.x,
        y: head.y + direction.y,
      };

      if (
        newHead.x < 0 || 
        newHead.x >= GRID_SIZE || 
        newHead.y < 0 || 
        newHead.y >= GRID_SIZE
      ) {
        setIsGameOver(true);
        return prevSnake;
      }

      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setIsGameOver(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      if (newHead.x === food.x && newHead.y === food.y) {
        const nextScore = score + 1;
        setScore(nextScore);
        onScoreUpdate(nextScore);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, isGameOver, isPaused, score, generateFood, onScoreUpdate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'arrowup': case 'w':
          if (direction.y !== 1) setDirection({ x: 0, y: -1 }); 
          setIsPaused(false);
          break;
        case 'arrowdown': case 's':
          if (direction.y !== -1) setDirection({ x: 0, y: 1 }); 
          setIsPaused(false);
          break;
        case 'arrowleft': case 'a':
          if (direction.x !== 1) setDirection({ x: -1, y: 0 }); 
          setIsPaused(false);
          break;
        case 'arrowright': case 'd':
          if (direction.x !== -1) setDirection({ x: 1, y: 0 }); 
          setIsPaused(false);
          break;
        case ' ':
          setIsPaused(!isPaused);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, isPaused, setIsPaused]);

  useEffect(() => {
    gameLoopRef.current = setInterval(moveSnake, TICK_RATE);
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [moveSnake]);

  return (
    <div className="z-10 relative">
      <div className="absolute -inset-1 bg-gradient-to-r from-neon-cyan to-neon-magenta rounded-sm blur opacity-25"></div>
      <div className="relative w-[min(90vw,480px)] h-[min(90vw,480px)] bg-black border border-dark-border grid p-1"
           style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)` }}>
        
        {/* Render Snake and Food */}
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
          const x = i % GRID_SIZE;
          const y = Math.floor(i / GRID_SIZE);
          const isHead = snake[0].x === x && snake[0].y === y;
          const isBody = snake.slice(1).some(s => s.x === x && s.y === y);
          const isFood = food.x === x && food.y === y;

          return (
            <div key={i} className="relative aspect-square">
              {isHead && (
                <div className="absolute inset-0 bg-neon-cyan shadow-[0_0_10px_#00ffcc]">
                   <div className="w-1 h-1 bg-black absolute top-1 left-1"></div>
                </div>
              )}
              {isBody && <div className="absolute inset-0 bg-neon-cyan opacity-80"></div>}
              {isFood && (
                <div className="absolute inset-0 bg-neon-magenta rounded-full animate-pulse shadow-[0_0_15px_#ff00ff]"></div>
              )}
            </div>
          );
        })}

        {/* Game Over Overlay */}
        <AnimatePresence>
          {isGameOver && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20"
             >
                <h3 className="text-4xl font-black italic tracking-tighter text-neon-magenta uppercase mb-4">Engine Failure</h3>
                <p className="text-xs font-mono text-gray-500 mb-6 uppercase tracking-widest">Score: {score}</p>
                <button 
                  onClick={resetGame}
                  className="px-8 py-3 bg-white text-black font-black uppercase text-xs tracking-widest hover:scale-105 transition-transform"
                >
                  Reset Core
                </button>
             </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- Main Application ---

export default function App() {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [progress, setProgress] = useState(65);
  const [sessionTime, setSessionTime] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('snake-high-score');
    if (saved) setHighScore(parseInt(saved));
    
    const timer = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleScoreUpdate = (newScore: number) => {
    setScore(newScore);
    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem('snake-high-score', newScore.toString());
    }
  };

  const togglePlay = () => setIsPlaying(!isPlaying);
  const skipForward = () => setCurrentIndex((prev) => (prev + 1) % TRACKS.length);
  const skipBack = () => setCurrentIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);

  return (
    <div className="min-h-screen bg-dark-bg text-[#e2e2e2] font-sans flex flex-col overflow-hidden border-8 border-dark-surface selection:bg-neon-cyan/30">
      
      {/* Header Section */}
      <header className="h-20 border-b border-dark-border flex items-center justify-between px-10 bg-black/40 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-neon-cyan to-neon-magenta rounded-full animate-pulse shadow-[0_0_15px_rgba(0,255,204,0.3)]"></div>
          <h1 className="text-2xl font-black italic tracking-tighter uppercase text-white">
            NEON.WAVE <span className="text-neon-magenta italic text-sm ml-2 font-normal">SYNTH ENGINE v1.2</span>
          </h1>
        </div>
        <div className="flex gap-8">
          <div className="text-right">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-none">High Score</p>
            <p className="text-xl font-mono text-neon-cyan font-bold leading-tight">{highScore.toString().padStart(6, '0')}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-none">Session Time</p>
            <p className="text-xl font-mono text-white font-bold leading-tight">{formatTime(sessionTime)}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: Music Player */}
        <aside className="w-80 border-r border-dark-border flex flex-col p-6 space-y-8 bg-black/20">
          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
              <Activity size={12} className="text-neon-magenta" />
              Frequency List
            </h2>
            <div className="space-y-4">
              {TRACKS.map((track, idx) => (
                <div 
                  key={track.id}
                  onClick={() => { setCurrentIndex(idx); setIsPlaying(true); }}
                  className={`group cursor-pointer p-3 border-l-2 transition-all ${
                    currentIndex === idx 
                    ? 'border-neon-magenta bg-dark-surface shadow-[4px_0_15px_rgba(255,0,255,0.1)]' 
                    : 'border-transparent hover:bg-dark-surface'
                  }`}
                >
                  <p className={`text-xs font-bold ${currentIndex === idx ? 'text-neon-magenta' : 'text-gray-500'}`}>
                    {(idx + 1).toString().padStart(2, '0')}
                  </p>
                  <p className={`text-sm font-bold ${currentIndex === idx ? 'text-white' : 'text-gray-300'}`}>
                    {track.title}
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase font-mono mt-0.5">
                    {track.type} / {track.duration}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-auto pb-4">
             <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 flex justify-between font-mono">
               <span>Input: {TRACKS[currentIndex].artist}</span>
               <span className="text-neon-cyan">Active</span>
             </div>
             <div className="h-[2px] w-full bg-dark-border mb-6 relative">
               <motion.div 
                 className="absolute left-0 top-0 h-full bg-neon-cyan shadow-[0_0_10px_#00ffcc]"
                 animate={{ width: `${isPlaying ? (sessionTime % 100) : progress}%` }}
               ></motion.div>
             </div>
             <div className="flex justify-between items-center px-4">
                <button onClick={skipBack} className="text-gray-500 hover:text-white transition-colors">
                  <SkipBack size={20} fill="currentColor" />
                </button>
                <button 
                  onClick={togglePlay}
                  className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black hover:scale-110 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                >
                  {isPlaying ? <Pause size={24} fill="black" /> : <Play size={24} fill="black" className="ml-1" />}
                </button>
                <button onClick={skipForward} className="text-gray-500 hover:text-white transition-colors">
                  <SkipForward size={20} fill="currentColor" />
                </button>
             </div>
          </section>
        </aside>

        {/* Center: Game Area */}
        <section className="flex-1 relative flex flex-col items-center justify-center bg-[#070707] overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
          
          <SnakeGame 
            onScoreUpdate={handleScoreUpdate} 
            isPaused={isPaused} 
            setIsPaused={setIsPaused} 
          />

          <div className="mt-8 flex gap-4 z-20">
            <kbd className="px-4 py-2 bg-dark-surface border border-[#333] text-[9px] font-mono text-gray-400 uppercase tracking-widest shadow-sm">
              W/A/S/D TO NAVIGATE
            </kbd>
            <kbd className="px-4 py-2 bg-dark-surface border border-[#333] text-[9px] font-mono text-gray-400 uppercase tracking-widest shadow-sm">
              SPACE TO OVERCLOCK
            </kbd>
          </div>
        </section>

        {/* Right Sidebar: Score/Visuals */}
        <aside className="w-64 border-l border-dark-border flex flex-col p-6 bg-black/20">
          <div className="mb-12">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">Accumulated</h2>
            <p className="text-8xl font-black text-white italic tracking-tighter leading-none">{score}</p>
            <p className="text-xs text-neon-cyan font-mono tracking-widest mt-1">+15 MULTIPLIER</p>
          </div>

          <div className="flex-1 flex flex-col justify-end space-y-6">
            <div>
              <div className="h-2 w-full bg-white/5 flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div 
                    key={i} 
                    className={`h-full w-4 transition-opacity duration-300 ${score > (i * 2) ? 'bg-neon-magenta opacity-100 shadow-[0_0_8px_#ff00ff]' : 'bg-neon-magenta opacity-20'}`}
                  ></div>
                ))}
              </div>
              <p className="text-[10px] text-gray-500 font-mono flex items-center gap-2">
                <Zap size={10} className="text-neon-cyan" />
                SIGNAL STRENGTH: OPTIMAL
              </p>
            </div>

            <div className="p-4 bg-dark-surface border border-dark-border">
              <p className="text-[10px] text-neon-magenta uppercase font-bold mb-3 flex items-center gap-2">
                <Terminal size={10} />
                System Log
              </p>
              <div className="text-[9px] font-mono text-gray-400 space-y-1.5 leading-relaxed">
                <p className="text-neon-cyan">&gt; Track: {TRACKS[currentIndex].title}</p>
                <p className="">&gt; Snake engine: Initialized</p>
                <p className="">&gt; Render: 120FPS STABLE</p>
                <p className="text-neon-magenta">&gt; Warning: High speed imminent</p>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Footer Section */}
      <footer className="h-12 bg-neon-magenta text-black px-10 flex items-center justify-between z-20">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
          <Layers size={14} />
          Phase Zero Architecture
        </p>
        <div className="flex gap-6 font-mono">
          <div className="flex items-center gap-1 border-r border-black/20 pr-4">
            <Cpu size={12} />
            <p className="text-[10px] font-bold uppercase">CPU: 12%</p>
          </div>
          <div className="flex items-center gap-1 border-r border-black/20 pr-4">
             <div className="w-2 h-2 bg-black rounded-full animate-ping mr-1"></div>
             <p className="text-[10px] font-bold uppercase">MEM: 420MB</p>
          </div>
          <p className="text-[10px] font-bold uppercase flex items-center gap-1">
             <Circle size={8} fill="black" />
             LATENCY: 4MS
          </p>
        </div>
      </footer>
    </div>
  );
}
