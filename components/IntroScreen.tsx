'use client';
import { motion, AnimatePresence, useMotionValue, useSpring, animate } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // 1. Importando o roteador

const EASE       = [0.16, 1,    0.3,  1  ] as const;
const EASE_SHARP = [0.22, 1,    0.36, 1  ] as const;
const EASE_BACK  = [0.34, 1.56, 0.64, 1  ] as const;

// ─────────────────────────────────────────────────────────────────────────────
// PARTICLE CANVAS — Ember sparks floating upward
// ─────────────────────────────────────────────────────────────────────────────
function ParticleCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    type Particle = {
      x: number; y: number; vx: number; vy: number;
      size: number; alpha: number; decay: number; color: string;
    };

    const particles: Particle[] = [];
    const GOLD  = '176,142,104';
    const BLUE  = '0,91,236';
    const WHITE = '255,255,255';

    const spawn = () => {
      const color = Math.random() < 0.6 ? GOLD : Math.random() < 0.5 ? BLUE : WHITE;
      particles.push({
        x:     Math.random() * canvas.width,
        y:     canvas.height + 10,
        vx:    (Math.random() - 0.5) * 0.6,
        vy:    -(Math.random() * 1.2 + 0.4),
        size:  Math.random() * 2.5 + 0.5,
        alpha: Math.random() * 0.6 + 0.2,
        decay: Math.random() * 0.004 + 0.002,
        color,
      });
    };

    let frame = 0;
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (frame % 3 === 0) { spawn(); spawn(); }
      frame++;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x    += p.vx;
        p.y    += p.vy;
        p.alpha -= p.decay;
        if (p.alpha <= 0) { particles.splice(i, 1); continue; }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle   = `rgba(${p.color},1)`;
        ctx.shadowColor = `rgba(${p.color},0.8)`;
        ctx.shadowBlur  = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    tick();
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: active ? 1 : 0, transition: 'opacity 1s' }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BLUEPRINT GRID
// ─────────────────────────────────────────────────────────────────────────────
function BlueprintGrid({ visible }: { visible: boolean }) {
  const cols = 8;
  const rows = 6;
  const W = 1440;
  const H = 900;

  const hLines = Array.from({ length: rows + 1 }, (_, i) => ({
    y: (H / rows) * i,
    delay: i * 0.08,
  }));
  const vLines = Array.from({ length: cols + 1 }, (_, i) => ({
    x: (W / cols) * i,
    delay: i * 0.07,
  }));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.06 }}
    >
      {hLines.map((l, i) => (
        <motion.line
          key={`h${i}`}
          x1={0} y1={l.y} x2={W} y2={l.y}
          stroke="#005BEC"
          strokeWidth="0.8"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={visible ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
          transition={{ duration: 1.2, delay: 0.3 + l.delay, ease: EASE }}
        />
      ))}
      {vLines.map((l, i) => (
        <motion.line
          key={`v${i}`}
          x1={l.x} y1={0} x2={l.x} y2={H}
          stroke="#B08E68"
          strokeWidth="0.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={visible ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
          transition={{ duration: 1.0, delay: 0.5 + l.delay, ease: EASE }}
        />
      ))}
      {[[20, 20], [W - 20, 20], [20, H - 20], [W - 20, H - 20]].map(([cx, cy], i) => (
        <motion.g key={`c${i}`}
          initial={{ opacity: 0, scale: 0 }}
          animate={visible ? { opacity: 0.8, scale: 1 } : { opacity: 0 }}
          transition={{ duration: 0.5, delay: 1.0 + i * 0.12, ease: EASE_BACK }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        >
          <line x1={cx - 14} y1={cy} x2={cx + 14} y2={cy} stroke="#B08E68" strokeWidth="1.5" />
          <line x1={cx} y1={cy - 14} x2={cx} y2={cy + 14} stroke="#B08E68" strokeWidth="1.5" />
          <circle cx={cx} cy={cy} r="3" fill="none" stroke="#B08E68" strokeWidth="1.5" />
        </motion.g>
      ))}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLASH LINE
// ─────────────────────────────────────────────────────────────────────────────
function SlashLine({ visible }: { visible: boolean }) {
  return (
    <motion.div
      className="absolute top-1/2 left-0 h-[2px] pointer-events-none"
      style={{
        background: 'linear-gradient(90deg, transparent, #B08E68 20%, #fff 50%, #B08E68 80%, transparent)',
        boxShadow: '0 0 20px 4px rgba(176,142,104,0.6)',
        width: '100%',
      }}
      initial={{ scaleX: 0, opacity: 0, transformOrigin: 'left center' }}
      animate={visible
        ? { scaleX: [0, 1, 1, 0], opacity: [0, 1, 1, 0], transformOrigin: ['left center', 'left center', 'right center', 'right center'] }
        : {}
      }
      transition={{ duration: 0.8, ease: EASE, times: [0, 0.45, 0.55, 1] }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ORBIT RINGS
// ─────────────────────────────────────────────────────────────────────────────
function OrbitRings({ visible }: { visible: boolean }) {
  const rings = [
    { size: 340, color: 'rgba(176,142,104,0.18)', duration: 16, delay: 0, dashed: false },
    { size: 560, color: 'rgba(0,91,236,0.12)',    duration: 25, delay: 0.3, dashed: true  },
    { size: 780, color: 'rgba(176,142,104,0.08)', duration: 38, delay: 0.6, dashed: false },
    { size: 1050,color: 'rgba(0,91,236,0.05)',    duration: 55, delay: 1.0, dashed: true  },
  ];

  return (
    <>
      {rings.map((r, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: r.size, height: r.size,
            top: '50%', left: '50%',
            marginTop: -r.size / 2, marginLeft: -r.size / 2,
            border: r.dashed
              ? `1px dashed ${r.color}`
              : `1px solid ${r.color}`,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={visible
            ? {
                scale:  [0, 1.1, 0.95, 1],
                opacity:[0, 1,   1,    1],
                rotate: [0, 360],
              }
            : { scale: 0, opacity: 0 }
          }
          transition={{
            scale:   { duration: 1.2, delay: 0.8 + r.delay, ease: EASE_BACK },
            opacity: { duration: 1.2, delay: 0.8 + r.delay },
            rotate:  { duration: r.duration, repeat: Infinity, ease: 'linear', delay: r.delay },
          }}
        />
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCANLINE SWEEP
// ─────────────────────────────────────────────────────────────────────────────
function ScanlineSweep({ trigger }: { trigger: boolean }) {
  return (
    <AnimatePresence>
      {trigger && (
        <motion.div
          className="absolute left-0 w-full pointer-events-none"
          style={{
            height: 120,
            background: 'linear-gradient(180deg, transparent, rgba(176,142,104,0.06) 40%, rgba(176,142,104,0.12) 50%, rgba(176,142,104,0.06) 60%, transparent)',
          }}
          initial={{ top: '-15%' }}
          animate={{ top: '110%' }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.8, ease: 'linear' }}
        />
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GLITCH TITLE
// ─────────────────────────────────────────────────────────────────────────────
function GlitchTitle({ visible }: { visible: boolean }) {
  const word = 'AGROTÓXICA';

  return (
    <div className="relative flex items-center justify-center overflow-visible" aria-label={word}>
      <motion.span
        className="absolute font-space font-black text-7xl md:text-[9rem] lg:text-[11rem] uppercase tracking-[-0.02em] leading-none text-agro-gold select-none pointer-events-none"
        style={{ filter: 'blur(1px)', clipPath: 'inset(35% 0 45% 0)' }}
        animate={{ x: [0, -6, 5, -3, 0], opacity: [0, 0.9, 0, 0.7, 0] }}
        transition={{ duration: 5, repeat: Infinity, repeatDelay: 6 }}
      >{word}</motion.span>
      <motion.span
        className="absolute font-space font-black text-7xl md:text-[9rem] lg:text-[11rem] uppercase tracking-[-0.02em] leading-none text-[#005BEC] select-none pointer-events-none"
        style={{ clipPath: 'inset(55% 0 8% 0)' }}
        animate={{ x: [0, 7, -4, 3, 0], opacity: [0, 0.7, 0, 0.5, 0] }}
        transition={{ duration: 5, repeat: Infinity, repeatDelay: 6, delay: 0.08 }}
      >{word}</motion.span>

      <span className="relative flex">
        {word.split('').map((char, i) => (
          <motion.span
            key={i}
            className="inline-block font-space font-black text-7xl md:text-[9rem] lg:text-[11rem] uppercase tracking-[-0.02em] leading-none text-white"
            style={{ textShadow: '0 0 40px rgba(176,142,104,0.3), 0 0 80px rgba(176,142,104,0.1)' }}
            initial={{ y: '130%', opacity: 0, rotateX: -90, filter: 'blur(8px)' }}
            animate={visible
              ? { y: '0%', opacity: 1, rotateX: 0, filter: 'blur(0px)' }
              : {}
            }
            transition={{
              duration: 0.8,
              delay: 0.08 + i * 0.06,
              ease: EASE_SHARP,
            }}
          >
            {char}
          </motion.span>
        ))}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOADING PROGRESS BAR
// ─────────────────────────────────────────────────────────────────────────────
function LoadingBar({ visible, onComplete }: { visible: boolean; onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!visible) return;
    let start: number | null = null;
    const DURATION = 2000;

    const tick = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const p = Math.min(elapsed / DURATION, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setProgress(Math.round(eased * 100));
      if (p < 1) requestAnimationFrame(tick);
      else onComplete();
    };

    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [visible, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={visible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: EASE }}
      className="w-full max-w-[360px] flex flex-col items-center gap-2"
    >
      <div className="w-full h-[2px] bg-white/10 rounded-full overflow-hidden relative">
        <motion.div
          className="h-full rounded-full"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #B08E68, #fff 80%, #B08E68)',
            boxShadow: '0 0 12px 2px rgba(176,142,104,0.8)',
          }}
        />
      </div>
      <motion.span className="font-space text-[11px] tracking-[0.35em] text-white/30 uppercase">
        {progress < 100 ? `Carregando... ${progress}%` : 'Pronto'}
      </motion.span>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VENETIAN BLIND EXIT
// ─────────────────────────────────────────────────────────────────────────────
function VenetianExit({ active, onDone }: { active: boolean; onDone: () => void }) {
  const STRIPS = 9;

  return (
    <AnimatePresence>
      {active && (
        <div className="absolute inset-0 pointer-events-none z-50">
          {Array.from({ length: STRIPS }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute left-0 w-full"
              style={{
                height: `${100 / STRIPS + 0.2}%`,
                top: `${(i / STRIPS) * 100}%`,
                background: i % 2 === 0
                  ? '#110D09'
                  : 'linear-gradient(90deg, #0d0a06, #1a1510)',
                borderTop: '1px solid rgba(176,142,104,0.15)',
              }}
              initial={{ scaleY: 0, transformOrigin: 'top' }}
              animate={{ scaleY: 1 }}
              transition={{
                duration: 0.45,
                delay: i * 0.055,
                ease: EASE_SHARP,
              }}
              onAnimationComplete={i === STRIPS - 1 ? onDone : undefined}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FLOATING WORDS
// ─────────────────────────────────────────────────────────────────────────────
function FloatingWords({ visible }: { visible: boolean }) {
  const words = [
    { text: 'POEIRA.',          x: 8,  y: 15, size: 11, delay: 1.0 },
    { text: 'LOTE RESTRITO',    x: 82, y: 22, size: 10, delay: 1.3 },
    { text: 'SAFRA 26',         x: 5,  y: 78, size: 13, delay: 1.6 },
    { text: '⚠️ ALTO TEOR TÓXICO', x: 75, y: 75, size: 11, delay: 1.1 },
    { text: 'SEM ANTÍDOTO',     x: 50, y: 8,  size: 9,  delay: 1.8 },
    { text: 'RAIZ GROSSA',      x: 15, y: 50, size: 10, delay: 1.4 },
    { text: 'ARREDA, SÔ!',      x: 88, y: 48, size: 9,  delay: 2.0 },
    { text: 'SISTEMA BRUTO',    x: 45, y: 90, size: 8,  delay: 2.2 },
  ];

  return (
    <>
      {words.map((w, i) => (
        <motion.span
          key={i}
          className="absolute font-space font-black uppercase select-none pointer-events-none text-white"
          style={{
            left: `${w.x}%`,
            top: `${w.y}%`,
            fontSize: w.size,
            letterSpacing: '0.3em',
            opacity: 0,
          }}
          animate={visible
            ? { opacity: [0, 0.07, 0.04, 0.06], y: [20, 0, -10, 0] }
            : {}
          }
          transition={{
            duration: 8,
            delay: w.delay,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
        >
          {w.text}
        </motion.span>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN INTRO SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function IntroScreen({ onComplete }: { onComplete: () => void }) {
  const router = useRouter(); // 2. Inicializando o roteador
  const [phase,     setPhase]     = useState(0);
  const [exiting,   setExiting]   = useState(false);
  const [loadReady, setLoadReady] = useState(false);
  const [btnReady,  setBtnReady]  = useState(false);
  const [scanTrig,  setScanTrig]  = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 600),
      setTimeout(() => setPhase(3), 900),
      setTimeout(() => setPhase(4), 1000),
      setTimeout(() => setPhase(5), 1300),
      setTimeout(() => setPhase(6), 2400),
      setTimeout(() => setScanTrig(true), 2800),
      setTimeout(() => setLoadReady(true), 3000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleLoadComplete = useCallback(() => {
    setBtnReady(true);
  }, []);

  const handleEnter = useCallback(() => {
    setExiting(true);
  }, []);

  // 3. Função disparada após a animação de saída concluir
  const handleFinalExit = useCallback(() => {
    router.push('/inicio'); // Redireciona para /inicio
    onComplete();           // Executa o callback original (limpa estado no app/page)
  }, [router, onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[10000] bg-[#0a0703] flex flex-col items-center justify-center overflow-hidden pointer-events-auto"
      initial={{ opacity: 1 }}
      style={{ perspective: 1000 }}
    >
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 900, height: 900,
          background: 'radial-gradient(circle, rgba(0,91,236,0.18) 0%, rgba(176,142,104,0.08) 40%, transparent 70%)',
          filter: 'blur(60px)',
          top: '50%', left: '50%',
          marginTop: -450, marginLeft: -450,
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.2, 1], opacity: [0, 0.3, 0.2] }}
        transition={{ duration: 2.5, ease: EASE, delay: 0.2 }}
      />
      
      <BlueprintGrid visible={phase >= 2} />
      <FloatingWords visible={phase >= 5} />
      <ParticleCanvas active={phase >= 2} />
      <SlashLine visible={phase >= 1} />
      <OrbitRings visible={phase >= 3} />
      <ScanlineSweep trigger={scanTrig} />

      <div className="relative z-10 flex flex-col items-center gap-8 px-6 w-full max-w-5xl">
        <motion.div
          initial={{ scale: 0.4, opacity: 0, filter: 'blur(20px)' }}
          animate={phase >= 4 ? { scale: 1, opacity: 1, filter: 'blur(0px)' } : {}}
          transition={{ duration: 1.2, ease: EASE_BACK }}
          className="relative"
        >
          <img
            src="/assets/logo/logoprincipal.png"
            alt="Agrotóxica"
            className="relative w-24 md:w-32 lg:w-36 object-contain drop-shadow-2xl"
          />
        </motion.div>

        <div className="overflow-visible -mt-2">
          <GlitchTitle visible={phase >= 5} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
          animate={phase >= 6 ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 1, ease: EASE }}
          className="flex flex-col items-center gap-3"
        >
          <p className="font-poppins text-white/50 tracking-[0.45em] uppercase text-xs md:text-sm text-center">
            Águia voa com águia · 2026
          </p>
        </motion.div>

        <LoadingBar visible={loadReady} onComplete={handleLoadComplete} />

        <AnimatePresence>
          {btnReady && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.8, ease: EASE_BACK }}
            >
              <motion.button
                onClick={handleEnter}
                className="relative group px-14 py-5 rounded-full overflow-hidden border border-white/15 hover:border-agro-gold/60 transition-colors duration-500"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
              >
                <motion.div
                  className="absolute inset-0 bg-agro-gold"
                  initial={{ x: '-101%' }}
                  whileHover={{ x: '0%' }}
                  transition={{ duration: 0.5, ease: EASE_SHARP }}
                />
                <span className="relative z-10 font-space font-bold text-white group-hover:text-agro-black text-lg md:text-xl uppercase tracking-[0.2em] transition-colors duration-400">
                  Acessar  →
                </span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. O VenetianExit agora chama handleFinalExit ao terminar */}
      <VenetianExit active={exiting} onDone={handleFinalExit} />
    </motion.div>
  );
}