'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import Link from 'next/link';
import { products } from '../../data/products';

const EASE       = [0.22, 1, 0.36, 1] as const;
const EASE_BACK  = [0.34, 1.56, 0.64, 1] as const;
const EASE_SHARP = [0.16, 1, 0.3, 1] as const;

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type Product = (typeof products)[number];

// ─────────────────────────────────────────────────────────────────────────────
// CURSOR BLOB
// ─────────────────────────────────────────────────────────────────────────────
function CursorBlob() {
  const x  = useMotionValue(0);
  const y  = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 50, damping: 20 });
  const sy = useSpring(y, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const move = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [x, y]);

  return (
    <motion.div
      className="fixed pointer-events-none z-0"
      style={{
        x: sx, y: sy, translateX: '-50%', translateY: '-50%',
        width: 700, height: 700, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(176,142,104,0.07) 0%, rgba(0,91,236,0.04) 45%, transparent 70%)',
        filter: 'blur(50px)',
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED GRID
// ─────────────────────────────────────────────────────────────────────────────
function AnimatedGrid() {
  return (
    <div className="absolute inset-0 pointer-events-none"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gridTemplateRows: 'repeat(9, 1fr)' }}
    >
      {Array.from({ length: 108 }).map((_, i) => (
        <motion.div key={i} className="border-[0.5px] border-agro-blue"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.03, 0, 0.02, 0] }}
          transition={{ duration: 5 + (i % 5), delay: (i * 0.04) % 3.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MARQUEE
// ─────────────────────────────────────────────────────────────────────────────
function Marquee({ text, dir = 1, speed = 55, opacity = 0.05 }: {
  text: string; dir?: number; speed?: number; opacity?: number;
}) {
  const rep = Array(12).fill(text).join('  ·  ');
  return (
    <div className="overflow-hidden w-full">
      <motion.p
        className="font-space font-bold uppercase whitespace-nowrap text-agro-blue text-sm tracking-[0.22em]"
        style={{ opacity }}
        animate={{ x: dir > 0 ? ['0%', '-50%'] : ['-50%', '0%'] }}
        transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
      >{rep}</motion.p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SPLIT LETTER TITLE
// ─────────────────────────────────────────────────────────────────────────────
function SplitTitle({ text, className = '', delay = 0 }: { text: string; className?: string; delay?: number }) {
  return (
    <span className={`inline-flex overflow-hidden ${className}`}>
      {text.split('').map((c, i) => (
        <motion.span key={i} className="inline-block"
          initial={{ y: '110%', opacity: 0, rotateX: -80 }}
          animate={{ y: '0%', opacity: 1, rotateX: 0 }}
          transition={{ duration: 0.65, delay: delay + i * 0.04, ease: EASE }}
        >
          {c === ' ' ? '\u00A0' : c}
        </motion.span>
      ))}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GLITCH CHAR
// ─────────────────────────────────────────────────────────────────────────────
function GlitchText({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={`relative inline-block ${className}`}>
      <motion.span className="absolute inset-0 text-agro-gold select-none"
        style={{ clipPath: 'inset(30% 0 50% 0)' }}
        animate={{ x: [0, -5, 4, -2, 0], opacity: [0, 0.7, 0, 0.5, 0] }}
        transition={{ duration: 4, repeat: Infinity, repeatDelay: 7 }}
      >{text}</motion.span>
      <motion.span className="absolute inset-0 text-agro-blue select-none"
        style={{ clipPath: 'inset(60% 0 8% 0)', filter: 'blur(0.5px)' }}
        animate={{ x: [0, 6, -3, 3, 0], opacity: [0, 0.5, 0, 0.4, 0] }}
        transition={{ duration: 4, repeat: Infinity, repeatDelay: 7, delay: 0.07 }}
      >{text}</motion.span>
      {text}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH INPUT
// ─────────────────────────────────────────────────────────────────────────────
const PLACEHOLDERS = [
  'Buscar produto...',
  'Ex: Camiseta Agrotóxica',
  'Ex: Boné, Calça, Meia...',
  'Encontre sua peça...',
];

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [phIdx,    setPhIdx]    = useState(0);
  const [phText,   setPhText]   = useState('');
  const [phChar,   setPhChar]   = useState(0);
  const [phDel,    setPhDel]    = useState(false);
  const [focused,  setFocused]  = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Typewriter placeholder
  useEffect(() => {
    if (focused || value) return;
    const cur = PLACEHOLDERS[phIdx];
    let t: ReturnType<typeof setTimeout>;
    if (!phDel && phChar < cur.length)       t = setTimeout(() => setPhChar(c => c + 1), 60);
    else if (!phDel && phChar === cur.length) t = setTimeout(() => setPhDel(true), 1800);
    else if (phDel && phChar > 0)            t = setTimeout(() => setPhChar(c => c - 1), 30);
    else { setPhDel(false); setPhIdx(i => (i + 1) % PLACEHOLDERS.length); }
    setPhText(cur.slice(0, phChar));
    return () => clearTimeout(t);
  }, [phChar, phDel, phIdx, focused, value]);

  return (
    <motion.div
      className="relative w-full max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.5, ease: EASE_BACK }}
    >
      {/* Glow ring when focused */}
      <motion.div
        className="absolute -inset-[3px] rounded-[28px] pointer-events-none"
        animate={{
          opacity: focused ? 1 : 0,
          boxShadow: focused
            ? '0 0 0 2px rgba(176,142,104,0.5), 0 0 40px rgba(176,142,104,0.2)'
            : '0 0 0 0px rgba(176,142,104,0)',
        }}
        transition={{ duration: 0.35 }}
      />

      {/* Glass pill */}
      <div
        className="relative flex items-center gap-4 px-6 py-4 rounded-[24px] transition-all duration-500"
        style={{
          background:           'rgba(255,255,255,0.07)',
          backdropFilter:       'blur(24px) saturate(170%)',
          WebkitBackdropFilter: 'blur(24px) saturate(170%)',
          border:               `1px solid ${focused ? 'rgba(176,142,104,0.35)' : 'rgba(0,91,236,0.12)'}`,
          boxShadow:            '0 8px 32px rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.05) inset',
        }}
      >
        {/* Search icon */}
        <motion.svg
          width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="flex-shrink-0 text-agro-blue transition-colors duration-300"
          style={{ color: focused ? '#B08E68' : undefined }}
          animate={{ rotate: focused ? [0, -15, 10, 0] : 0 }}
          transition={{ duration: 0.4 }}
        >
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </motion.svg>

        {/* Actual input (transparent, on top) */}
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="w-full bg-transparent outline-none font-space font-bold text-xl text-agro-blue uppercase tracking-wide relative z-10"
            style={{ caretColor: '#B08E68' }}
            aria-label="Buscar produto"
          />
          {/* Animated placeholder */}
          {!value && (
            <span className="absolute inset-0 flex items-center font-space font-bold text-xl uppercase tracking-wide text-agro-blue/30 pointer-events-none select-none">
              {phText}
              {!focused && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.55, repeat: Infinity }}
                  className="inline-block ml-0.5 border-r-2 border-agro-gold h-[0.85em] align-middle"
                />
              )}
            </span>
          )}
        </div>

        {/* Clear button */}
        <AnimatePresence>
          {value && (
            <motion.button
              onClick={() => { onChange(''); inputRef.current?.focus(); }}
              className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-agro-blue/50 hover:text-agro-blue hover:bg-agro-blue/10 transition-all"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: EASE_BACK }}
              whileTap={{ scale: 0.85 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FILTER CHIPS
// ─────────────────────────────────────────────────────────────────────────────
function FilterChips({ active, onChange }: { active: string; onChange: (v: string) => void }) {
  // Derive unique types from products
  const types = useMemo(() => {
    const all = ['Tudo', ...Array.from(new Set(products.map(p => (p as any).type || 'Outros')))];
    return all;
  }, []);

  return (
    <motion.div
      className="flex flex-wrap gap-2 justify-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.7, ease: EASE }}
    >
      {types.map((t, i) => {
        const isActive = active === t;
        return (
          <motion.button
            key={t}
            onClick={() => onChange(t)}
            className="relative px-5 py-2 rounded-full font-space font-bold text-xs uppercase tracking-[0.18em] overflow-hidden transition-all duration-300"
            style={{
              border: `1px solid ${isActive ? 'rgba(176,142,104,0.6)' : 'rgba(0,91,236,0.15)'}`,
              background: isActive ? 'rgba(176,142,104,0.12)' : 'rgba(255,255,255,0.04)',
              color: isActive ? '#B08E68' : undefined,
              backdropFilter: 'blur(12px)',
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: 0.75 + i * 0.05, ease: EASE_BACK }}
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.94 }}
          >
            {isActive && (
              <motion.div
                className="absolute inset-0 rounded-full"
                layoutId="chip-active"
                style={{ background: 'rgba(176,142,104,0.1)' }}
                transition={{ duration: 0.3, ease: EASE }}
              />
            )}
            <span className="relative z-10">{t}</span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RESULT COUNT
// ─────────────────────────────────────────────────────────────────────────────
function ResultCount({ count, total, query }: { count: number; total: number; query: string }) {
  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.9 }}
    >
      <div className="h-[1px] bg-agro-blue/15 flex-1" />
      <AnimatePresence mode="wait">
        <motion.span
          key={`${count}-${query}`}
          className="font-poppins text-xs uppercase tracking-[0.25em] text-agro-blue/50 whitespace-nowrap"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.3 }}
        >
          {query
            ? `${count} resultado${count !== 1 ? 's' : ''} para "${query}"`
            : `${count} de ${total} peças`
          }
        </motion.span>
      </AnimatePresence>
      <div className="h-[1px] bg-agro-blue/15 flex-1" />
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT CARD
// ─────────────────────────────────────────────────────────────────────────────
function SearchCard({ produto, index }: { produto: Product; index: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 40, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.88, y: -20 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: EASE }}
    >
      <Link href={`/produto/${produto.id}`}>
        <motion.div
          whileHover={{ y: -10, scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          transition={{ duration: 0.32, ease: EASE }}
          className="group relative"
        >
          <div
            className="rounded-3xl p-5 aspect-[4/5] flex flex-col justify-between border-2 border-transparent group-hover:border-agro-gold overflow-hidden relative transition-all duration-500"
            style={{
              background:           'rgba(255,255,255,0.06)',
              backdropFilter:       'blur(20px) saturate(160%)',
              WebkitBackdropFilter: 'blur(20px) saturate(160%)',
              boxShadow:            '0 4px 24px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.05) inset',
            }}
          >
            {/* Shine sweep */}
            <motion.div
              className="absolute inset-0 pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: 'linear-gradient(115deg, transparent 30%, rgba(176,142,104,0.07) 50%, transparent 70%)',
                backgroundSize: '200% 100%',
              }}
              animate={{ backgroundPositionX: ['200%', '-200%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />

            {/* Card index */}
            <span className="absolute top-4 right-4 font-space font-bold text-[10px] tracking-widest text-agro-blue/20 group-hover:text-agro-blue/50 transition-all duration-500">
              {String(index + 1).padStart(2, '0')}
            </span>

            {/* Type badge */}
            {(produto as any).type && (
              <motion.span
                className="absolute top-4 left-4 px-2.5 py-1 rounded-full font-poppins font-bold text-[9px] uppercase tracking-widest text-agro-blue/60 border border-agro-blue/15"
                style={{ background: 'rgba(0,91,236,0.06)' }}
              >
                {(produto as any).type}
              </motion.span>
            )}

            {/* Image */}
            <div className="w-full h-[65%] rounded-2xl flex items-center justify-center overflow-hidden relative mt-6">
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: 'radial-gradient(circle at 50% 60%, rgba(176,142,104,0.13) 0%, transparent 70%)' }}
              />
              <img
                src={produto.image}
                alt={produto.nome}
                className="w-full h-full object-contain p-3 group-hover:scale-110 transition-transform duration-700"
              />
            </div>

            {/* Info */}
            <div className="mt-3 overflow-hidden">
              <h4 className="font-space font-bold text-3xl uppercase leading-none text-agro-blue">{produto.nome}</h4>
              <div className="flex items-center justify-between mt-2">
                <p className="text-agro-gold font-bold text-base font-poppins">{produto.price}</p>
                <motion.span
                  className="text-[10px] font-poppins font-bold uppercase tracking-widest text-agro-blue opacity-0 group-hover:opacity-40 -translate-x-2 group-hover:translate-x-0 transition-all duration-400"
                >
                  Ver →
                </motion.span>
              </div>
            </div>

            {/* Bottom bar */}
            <motion.div
              className="absolute bottom-0 left-0 h-[2px] bg-agro-gold rounded-full"
              initial={{ width: '0%' }}
              whileHover={{ width: '100%' }}
              transition={{ duration: 0.38, ease: EASE }}
            />
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────
function EmptyState({ query }: { query: string }) {
  return (
    <motion.div
      className="col-span-full flex flex-col items-center justify-center py-32 gap-6"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5, ease: EASE_BACK }}
    >
      {/* Animated search icon */}
      <div className="relative">
        <motion.div
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(0,91,236,0.06)',
            border: '1px solid rgba(0,91,236,0.12)',
          }}
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            className="text-agro-blue/30"
          >
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </motion.div>
        <motion.div
          className="absolute inset-0 rounded-full border border-agro-gold/20"
          animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
        />
      </div>

      <div className="text-center space-y-2">
        <p className="font-space font-bold text-2xl uppercase text-agro-blue/40 tracking-tighter">
          Nenhuma peça encontrada
        </p>
        <p className="font-poppins text-sm text-agro-blue/30 tracking-wider">
          Nenhum resultado para{' '}
          <span className="text-agro-gold font-bold">"{query}"</span>
        </p>
      </div>

      <motion.div
        className="flex items-center gap-2 px-4 py-2 rounded-full border border-agro-blue/10 text-agro-blue/30"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        <span className="font-poppins text-xs uppercase tracking-widest">Tente outro termo</span>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND
// ─────────────────────────────────────────────────────────────────────────────
function SearchBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <CursorBlob />
      <AnimatedGrid />

      {/* Scanlines */}
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.012) 2px, rgba(0,0,0,0.012) 4px)',
        }}
        animate={{ backgroundPositionY: ['0px', '4px'] }}
        transition={{ duration: 0.14, repeat: Infinity, ease: 'linear' }}
      />

      {/* Big typographic backdrop */}
      <motion.div
        initial={{ opacity: 0, x: -80 }}
        animate={{ opacity: 0.04, x: 0 }}
        transition={{ duration: 1.6, ease: EASE }}
        className="absolute top-4 left-[-3%] leading-none select-none"
      >
        <GlitchText
          text="BUSCA"
          className="font-space font-black text-[14rem] md:text-[20rem] uppercase text-agro-blue"
        />
      </motion.div>

      <motion.p
        initial={{ opacity: 0, rotate: -6 }}
        animate={{ opacity: 0.025, rotate: -6 }}
        transition={{ duration: 2, delay: 0.6 }}
        className="absolute top-[42%] left-[5%] whitespace-nowrap font-space font-black text-[6rem] uppercase text-agro-gold leading-none select-none"
      >
        PESQUISAR · DESCOBRIR · VESTIR
      </motion.p>

      {/* Marquees */}
<div className="absolute top-[7%] w-full flex flex-col gap-4">
        <Marquee text="AGROTÓXICA  ·  LOTE RESTRITO  ·  TRAIA DE PATRÃO  ·  SÓ QUEM É DA LIDA" dir={1} speed={58} opacity={0.05} />
        <Marquee text="RAIZ GROSSA  ·  MOAGEM  ·  NO MUDO DO MODÃO  ·  SISTEMA BRUTO  ·  SAFRA 26" dir={-1} speed={44} opacity={0.03} />
      </div>
      <div className="absolute bottom-[6%] w-full flex flex-col gap-4">
        <Marquee text="O VENENO CHEGOU  ·  ARREDA SÔ  ·  TRAIADO  ·  AGROTÓXICA  ·  NÓIS É O TREM" dir={-1} speed={52} opacity={0.045} />
        <Marquee text="AGUENTA O TRANCO  ·  SEM MASSAGEM  ·  MARCHA NO TRATOR  ·  LOTE 2026" dir={1} speed={66} opacity={0.028} />
      </div>

      {/* Orbit rings */}
      {[300, 550, 800].map((size, i) => (
        <motion.div key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: size, height: size,
            top: '50%', left: '50%',
            marginTop: -size / 2, marginLeft: -size / 2,
            border: i % 2 === 0 ? '1px solid rgba(0,91,236,0.06)' : '1px dashed rgba(176,142,104,0.1)',
          }}
          animate={{ rotate: [0, 360], scale: [0.97, 1.03, 0.97] }}
          transition={{
            rotate: { duration: 20 + i * 12, repeat: Infinity, ease: 'linear' },
            scale:  { duration: 8 + i * 2,   repeat: Infinity, ease: 'easeInOut' },
          }}
        />
      ))}

      {/* Noise grain */}
      <div
        className="absolute inset-0 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E")`,
          opacity: 0.4,
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function BuscaPage() {
  const [query,  setQuery]  = useState('');
  const [filter, setFilter] = useState('Tudo');

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchQ = !query || p.nome.toLowerCase().includes(query.toLowerCase());
      const matchF = filter === 'Tudo' || (p as any).type === filter;
      return matchQ && matchF;
    });
  }, [query, filter]);

  // Reset filter when searching
  useEffect(() => {
    if (query && filter !== 'Tudo') setFilter('Tudo');
  }, [query]);

  return (
    <div className="min-h-screen relative overflow-hidden pb-40 transition-colors duration-500">
      <SearchBackground />

      <div className="container mx-auto px-6 pt-20 pb-10 relative z-10">

        {/* ── Page header ── */}
        <header className="mb-12">
          <motion.div
            className="flex items-center gap-3 mb-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Link
              href="/?skipIntro=true"
              className="font-poppins text-xs font-bold uppercase tracking-[0.22em] text-agro-gold hover:opacity-60 transition-opacity flex items-center gap-2"
            >
              ← Voltar
            </Link>
            <span className="text-agro-blue/20 text-xs">/</span>
            <span className="font-poppins text-xs uppercase tracking-[0.22em] text-agro-blue/40">Busca</span>
          </motion.div>

          <h1 className="font-space font-black text-5xl md:text-7xl uppercase tracking-tighter leading-none text-agro-blue">
            <SplitTitle text="Encontre" delay={0.2} />
            {' '}
            <SplitTitle text="sua peça" className="text-agro-gold" delay={0.45} />
          </h1>

          <motion.div
            className="h-[2px] bg-gradient-to-r from-agro-gold via-agro-blue to-transparent mt-4 rounded-full"
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.9, ease: EASE }}
            style={{ width: '45%' }}
          />
        </header>

        {/* ── Search input ── */}
        <div className="mb-6">
          <SearchInput value={query} onChange={setQuery} />
        </div>

        {/* ── Filter chips ── */}
        <div className="mb-8">
          <FilterChips active={filter} onChange={setFilter} />
        </div>

        {/* ── Result count ── */}
        <div className="mb-8">
          <ResultCount count={filtered.length} total={products.length} query={query} />
        </div>

        {/* ── Product grid ── */}
        <motion.div
          layout
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
        >
          <AnimatePresence mode="popLayout">
            {filtered.length > 0
              ? filtered.map((p, i) => <SearchCard key={p.id} produto={p} index={i} />)
              : <EmptyState key="empty" query={query} />
            }
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}