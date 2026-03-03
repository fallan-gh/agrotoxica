'use client';
import { useState, Suspense, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, useSpring, useScroll, useTransform, stagger, animate } from 'framer-motion';
import Link from 'next/link';
import { products } from '../data/products';
import IntroScreen from '../components/IntroScreen';
import Hotbar from '../components/Hotbar';
import DiscountPopup from '../components/DiscountPopup';

// ─────────────────────────────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────────────────────────────

function useTypewriter(phrases: string[], speed = 70, pause = 2200) {
  const [display, setDisplay] = useState('');
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[phraseIdx];
    let t: ReturnType<typeof setTimeout>;
    if (!deleting && charIdx < current.length) {
      t = setTimeout(() => setCharIdx((c) => c + 1), speed);
    } else if (!deleting && charIdx === current.length) {
      t = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && charIdx > 0) {
      t = setTimeout(() => setCharIdx((c) => c - 1), speed / 2.5);
    } else {
      setDeleting(false);
      setPhraseIdx((i) => (i + 1) % phrases.length);
    }
    setDisplay(current.slice(0, charIdx));
    return () => clearTimeout(t);
  }, [charIdx, deleting, phraseIdx, phrases, speed, pause]);

  return display;
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function CursorBlob() {
  const x = useMotionValue(typeof window !== 'undefined' ? window.innerWidth / 2 : 0);
  const y = useMotionValue(typeof window !== 'undefined' ? window.innerHeight / 2 : 0);
  const sx = useSpring(x, { stiffness: 45, damping: 18 });
  const sy = useSpring(y, { stiffness: 45, damping: 18 });

  useEffect(() => {
    const move = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [x, y]);

  return (
    <motion.div
      className="fixed pointer-events-none z-0"
      style={{
        x: sx, y: sy,
        translateX: '-50%', translateY: '-50%',
        width: 800, height: 800,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(176,142,104,0.09) 0%, rgba(0,91,236,0.05) 45%, transparent 70%)',
        filter: 'blur(50px)',
      }}
    />
  );
}

function Marquee({ text, direction = 1, speed = 55, opacity = 0.05, size = 'text-base' }: {
  text: string; direction?: number; speed?: number; opacity?: number; size?: string;
}) {
  const repeated = Array(14).fill(text).join('  ·  ');
  return (
    <div className="overflow-hidden w-full">
      <motion.p
        className={`font-space font-bold uppercase whitespace-nowrap text-agro-blue ${size} tracking-[0.25em]`}
        style={{ opacity }}
        animate={{ x: direction > 0 ? ['0%', '-50%'] : ['-50%', '0%'] }}
        transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
      >
        {repeated}
      </motion.p>
    </div>
  );
}

function GlitchWord({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={`relative inline-block ${className}`}>
      <motion.span
        className="absolute inset-0 text-agro-gold"
        style={{ clipPath: 'inset(30% 0 50% 0)' }}
        animate={{ x: [0, -5, 4, -2, 0], opacity: [0, 0.8, 0, 0.5, 0] }}
        transition={{ duration: 4, repeat: Infinity, repeatDelay: 5 }}
      >{text}</motion.span>
      <motion.span
        className="absolute inset-0 text-agro-blue"
        style={{ clipPath: 'inset(60% 0 10% 0)', filter: 'blur(0.6px)' }}
        animate={{ x: [0, 6, -3, 3, 0], opacity: [0, 0.6, 0, 0.4, 0] }}
        transition={{ duration: 4, repeat: Infinity, repeatDelay: 5, delay: 0.07 }}
      >{text}</motion.span>
      {text}
    </span>
  );
}

function FloatingGlyph({ char, x, y, delay, size }: { char: string; x: number; y: number; delay: number; size: number }) {
  return (
    <motion.span
      className="absolute font-space font-black text-agro-blue select-none pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, fontSize: size }}
      initial={{ opacity: 0, scale: 0.3, rotate: -25 }}
      animate={{
        opacity: [0, 0.08, 0.04, 0.06, 0],
        scale: [0.6, 1.3, 0.85, 1.15, 0.7],
        rotate: [0, 18, -12, 22, 0],
        y: [0, -50, 30, -25, 0],
      }}
      transition={{ duration: 14 + delay, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      {char}
    </motion.span>
  );
}

function AnimatedGrid() {
  return (
    <div
      className="absolute inset-0 pointer-events-none z-0"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gridTemplateRows: 'repeat(10, 1fr)' }}
    >
      {Array.from({ length: 140 }).map((_, i) => (
        <motion.div
          key={i}
          className="border-[0.5px] border-agro-blue"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.035, 0, 0.02, 0] }}
          transition={{ duration: 5 + (i % 6), delay: (i * 0.05) % 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

function OrbitRing({ size, delay, duration, dashed = false }: { size: number; delay: number; duration: number; dashed?: boolean }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size, height: size,
        top: '50%', left: '50%',
        marginTop: -size / 2, marginLeft: -size / 2,
        border: dashed ? '1px dashed rgba(176,142,104,0.15)' : '1px solid rgba(0,91,236,0.08)',
      }}
      animate={{ rotate: [0, 360], scale: [0.95, 1.05, 0.95] }}
      transition={{
        rotate: { duration, repeat: Infinity, ease: 'linear', delay },
        scale: { duration: duration * 0.4, repeat: Infinity, ease: 'easeInOut', delay },
      }}
    />
  );
}

function Scanlines() {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none z-0"
      style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.012) 2px, rgba(0,0,0,0.012) 4px)',
      }}
      animate={{ backgroundPositionY: ['0px', '4px'] }}
      transition={{ duration: 0.14, repeat: Infinity, ease: 'linear' }}
    />
  );
}

function CornerCross({ style }: { style: React.CSSProperties }) {
  return (
    <motion.svg
      width="28" height="28" viewBox="0 0 28 28"
      className="absolute text-agro-gold pointer-events-none"
      style={{ opacity: 0, ...style }}
      animate={{ opacity: [0, 0.35, 0.15, 0.3], rotate: [0, 360] }}
      transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
    >
      <line x1="14" y1="0" x2="14" y2="28" stroke="currentColor" strokeWidth="1.5" />
      <line x1="0" y1="14" x2="28" y2="14" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="14" cy="14" r="2" fill="currentColor" />
    </motion.svg>
  );
}

function CounterStrip() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1.8, duration: 1 }}
      className="absolute top-28 right-8 flex flex-col gap-2 items-end z-0 pointer-events-none"
    >
      {['01', '02', '03', '04'].map((n, i) => (
        <motion.span
          key={n}
          className="font-space font-bold text-[10px] tracking-widest text-agro-gold"
          animate={{ opacity: [0.15, 0.9, 0.15] }}
          transition={{ duration: 3.5, delay: i * 0.7, repeat: Infinity }}
        >
          {n}
        </motion.span>
      ))}
    </motion.div>
  );
}

function SplitTitle({ text, className = '', delay = 0 }: { text: string; className?: string; delay?: number }) {
  return (
    <span className={`inline-flex overflow-hidden ${className}`}>
      {text.split('').map((c, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ y: '110%', opacity: 0, rotateX: -90 }}
          animate={{ y: '0%', opacity: 1, rotateX: 0 }}
          transition={{ duration: 0.7, delay: delay + i * 0.045, ease: [0.22, 1, 0.36, 1] }}
        >
          {c === ' ' ? '\u00A0' : c}
        </motion.span>
      ))}
    </span>
  );
}

function VitrineBackground() {
  const typewriter = useTypewriter([
    'O VENENO DA ROÇA.',
    'SISTEMA BRUTO.',
    'SAFRA 26.',
    'AGROTÓXICA.',
    'TRAIA DE RESPEITO.',
    'SEM ANTÍDOTO.',
  ]);

  const glyphs = 'AGROTÓXICA2026'.split('').map((char, i) => ({
    char,
    x: (i * 23 + 7) % 92,
    y: (i * 17 + 5) % 88,
    delay: i * 0.6 + 0.5,
    size: Math.floor(Math.random() * 80 + 24),
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <CursorBlob />
      <Scanlines />
      <AnimatedGrid />

      <OrbitRing size={500} delay={0} duration={22} />
      <OrbitRing size={850} delay={2} duration={35} dashed />
      <OrbitRing size={1200} delay={4} duration={55} />
      <OrbitRing size={1600} delay={1} duration={75} dashed />

      <CornerCross style={{ top: '3%', left: '1.5%' }} />
      <CornerCross style={{ top: '3%', right: '1.5%' }} />
      <CornerCross style={{ bottom: '3%', left: '1.5%' }} />
      <CornerCross style={{ bottom: '3%', right: '1.5%' }} />

      {glyphs.map((g, i) => <FloatingGlyph key={i} {...g} />)}

      <motion.div
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 0.045, x: 0 }}
        transition={{ duration: 1.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="absolute top-0 left-[-4%] leading-none select-none"
      >
        <GlitchWord
          text="AGRONOMIA"
          className="font-space font-black text-[14rem] md:text-[20rem] uppercase text-agro-blue"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, rotate: -8, x: '30%' }}
        animate={{ opacity: 0.028, rotate: -8, x: '8%' }}
        transition={{ duration: 2.2, delay: 0.5 }}
        className="absolute top-[45%] whitespace-nowrap select-none"
      >
        <span className="font-space font-black text-[7rem] uppercase text-agro-gold leading-none">
          AGROTÓXICA · AGROTÓXICA · AGROTÓXICA
        </span>
      </motion.div>

      <div className="absolute top-[8%] w-full flex flex-col gap-5">
        <Marquee text="AGROTÓXICA  ·  NÓIS É O TREM  ·  TRAIA DE PATRÃO  ·  SISTEMA BRUTO E SISTEMÁTICO" direction={1} speed={60} opacity={0.055} />
        <Marquee text="NU! QUE TREM TÓXICO  ·  CHIQUE NO ÚRTIMO  ·  LIDA BRUTA  ·  O VENENO DA ROÇA  ·  SAFRA 26" direction={-1} speed={45} opacity={0.038} size="text-sm" />
      </div>

      <div className="absolute bottom-[8%] w-full flex flex-col gap-5">
        <Marquee text="MARCHA NO MAQUINÁRIO  ·  ARREDA QUE O VENENO CHEGOU  ·  SEM MASSAGEM  ·  REINANDO NO MATO  ·  POEIRA" direction={-1} speed={52} opacity={0.05} />
        <Marquee text="AGROTÓXICA  ·  2026  ·  AGUENTA O TRANCO  ·  TRAIADO E ALCOOLIZADO  ·  TCHAU BRIGADO!" direction={1} speed={68} opacity={0.033} size="text-sm" />
      </div>

      <CounterStrip />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 1 }}
        className="absolute bottom-6 left-8 z-10"
      >
        <div className="flex items-center gap-3">
          <motion.div
            className="w-2 h-2 rounded-full bg-agro-gold"
            animate={{ scale: [1, 1.7, 1], opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.1, repeat: Infinity }}
          />
          <span className="font-poppins text-xs uppercase tracking-[0.28em] opacity-35 text-agro-blue">
            {typewriter}
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.55, repeat: Infinity }}
              className="inline-block ml-0.5 border-r-2 border-agro-gold h-[0.9em] align-middle"
            />
          </span>
        </div>
      </motion.div>

      {[25, 50, 75].map((pct, i) => (
        <motion.div
          key={pct}
          className="absolute w-full h-[1px] bg-agro-blue pointer-events-none"
          style={{ top: `${pct}%` }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 0.04 }}
          transition={{ duration: 2, delay: 0.4 + i * 0.3, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}

      <div
        className="absolute inset-0 pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E")`,
          opacity: 0.45,
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT CARD — enhanced with Favorite Button
// ─────────────────────────────────────────────────────────────────────────────
function ProductCard({ produto, index }: { produto: (typeof products)[0]; index: number }) {
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('agro-favorites') || '[]');
      setIsFav(stored.includes(produto.id));
    } catch {
      setIsFav(false);
    }
  }, [produto.id]);

  const toggleFav = (e: React.MouseEvent) => {
    e.preventDefault(); // Impede o clique de abrir a página
    e.stopPropagation();

    try {
      const stored = JSON.parse(localStorage.getItem('agro-favorites') || '[]');
      let updated;
      if (stored.includes(produto.id)) {
        updated = stored.filter((id: string) => id !== produto.id);
        setIsFav(false);
      } else {
        updated = [...stored, produto.id];
        setIsFav(true);
      }
      localStorage.setItem('agro-favorites', JSON.stringify(updated));
    } catch {
      console.error("Erro ao acessar favoritos.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.6 + index * 0.12, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={`/produto/${produto.id}`}>
        <motion.div
          whileHover={{ y: -12, scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="group relative"
        >
          <div className="bg-agro-card rounded-3xl p-6 shadow-2xl aspect-[4/5] flex flex-col justify-between border-2 border-transparent group-hover:border-agro-gold transition-all duration-500 overflow-hidden relative">
            
            {/* Shine sweep on hover */}
            <motion.div
              className="absolute inset-0 pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: 'linear-gradient(115deg, transparent 30%, rgba(176,142,104,0.08) 50%, transparent 70%)',
                backgroundSize: '200% 100%',
              }}
              animate={{ backgroundPositionX: ['200%', '-200%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />

            {/* BOTÃO DE FAVORITO */}
            <motion.button
              onClick={toggleFav}
              className="absolute top-4 left-4 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-agro-bg/60 backdrop-blur-md border border-agro-blue/10 transition-all duration-300 shadow-sm overflow-hidden"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.85 }}
              style={{
                color: isFav ? '#ef4444' : 'var(--color-blue)',
                borderColor: isFav ? 'rgba(239,68,68,0.3)' : '',
              }}
            >
              <AnimatePresence>
                {isFav && (
                  <motion.div
                    className="absolute inset-0 bg-red-500/20"
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.6 }}
                  />
                )}
              </AnimatePresence>
              
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </motion.button>

            {/* Card number */}
            <motion.span
              className="absolute top-4 right-5 font-space font-bold text-xs tracking-widest text-agro-blue opacity-20 group-hover:opacity-60 transition-opacity duration-500"
            >
              {String(index + 1).padStart(2, '0')}
            </motion.span>

            {/* Image */}
            <div className="w-full h-[70%] bg-agro-blue/10 rounded-2xl flex items-center justify-center overflow-hidden relative mt-2">
              <img
                src={produto.image}
                alt={produto.nome}
                className="w-full h-full object-contain p-4 group-hover:scale-115 transition-transform duration-700"
              />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: 'radial-gradient(circle at 50% 60%, rgba(176,142,104,0.15) 0%, transparent 70%)' }}
              />
            </div>

            {/* Info */}
            <div className="mt-4 overflow-hidden">
              <motion.h4
                className="font-space font-bold text-4xl uppercase leading-none overflow-hidden"
              >
                <span className="block translate-y-0 group-hover:translate-y-0 transition-transform duration-500">
                  {produto.nome}
                </span>
              </motion.h4>
              <div className="flex items-center justify-between mt-2">
                <p className="text-agro-gold font-bold text-lg">{produto.price}</p>
                <motion.span
                  className="text-xs font-poppins font-bold uppercase tracking-widest text-agro-blue opacity-0 group-hover:opacity-50 transition-all duration-500 -translate-x-3 group-hover:translate-x-0"
                >
                  Ver →
                </motion.span>
              </div>
            </div>

            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-agro-gold rounded-full"
              initial={{ width: '0%' }}
              whileHover={{ width: '100%' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOME CONTENT
// ─────────────────────────────────────────────────────────────────────────────
function HomeContent() {
  const searchParams = useSearchParams();
  const skipIntroParam = searchParams.get('skipIntro') === 'true';
  const [showIntro, setShowIntro] = useState(!skipIntroParam);

  return (
    <>
      <AnimatePresence mode="wait">
        {showIntro && (
          <IntroScreen key="intro" onComplete={() => setShowIntro(false)} />
        )}
      </AnimatePresence>

      {!showIntro && (
        <motion.div
          initial={{ opacity: skipIntroParam ? 1 : 0 }}
          animate={{ opacity: 1 }}
          className="relative z-10"
        >
          <VitrineBackground />

          <div className="container mx-auto px-6 pt-32 relative z-10">
            
            <header className="mb-20">
              <motion.h2
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="text-2xl font-bold text-agro-gold tracking-widest uppercase mb-3 font-poppins flex items-center gap-3"
              >
                <motion.span
                  className="inline-block w-8 h-[2px] bg-agro-gold"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                />
                Coleção 2026
                <motion.span
                  className="inline-block w-8 h-[2px] bg-agro-gold"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                />
              </motion.h2>

              <h3 className="font-space font-bold text-7xl md:text-9xl uppercase tracking-tighter leading-none">
                <SplitTitle text="Agrotóxica" delay={0.35} />
              </h3>

              <motion.div
                className="h-[3px] bg-gradient-to-r from-agro-gold via-agro-blue to-transparent mt-4 rounded-full"
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.2, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
                style={{ width: '60%' }}
              />

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.45 }}
                transition={{ delay: 1.2, duration: 1 }}
                className="font-poppins text-xs uppercase tracking-[0.3em] mt-4 text-agro-blue"
              >
                {products.length} peças disponíveis
              </motion.p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map((produto, i) => (
                <ProductCard key={produto.id} produto={produto} index={i} />
              ))}
            </div>
          </div>

          <Hotbar />
          <DiscountPopup />
        </motion.div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <main className="min-h-screen relative pb-32">
      <Suspense fallback={<div className="bg-agro-black min-h-screen" />}>
        <HomeContent />
      </Suspense>
    </main>
  );
}