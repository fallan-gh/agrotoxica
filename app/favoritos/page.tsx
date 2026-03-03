'use client';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import Link from 'next/link';
import { products } from '../../data/products';

const EASE      = [0.22, 1, 0.36, 1] as const;
const EASE_BACK = [0.34, 1.56, 0.64, 1] as const;
const EASE_SHARP= [0.16, 1, 0.3, 1] as const;

// ─────────────────────────────────────────────────────────────────────────────
// DARK MODE HOOK
// ─────────────────────────────────────────────────────────────────────────────
function useIsDark() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

// ─────────────────────────────────────────────────────────────────────────────
// FAVORITES LOGIC (Local Storage)
// ─────────────────────────────────────────────────────────────────────────────
const FAV_KEY = 'agro-favorites';

function useFavorites() {
  const [favIds, setFavIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
      setFavIds(stored);
    } catch {
      setFavIds([]);
    }
  }, []);

  const removeFav = (id: string) => {
    const updated = favIds.filter(favId => favId !== id);
    setFavIds(updated);
    localStorage.setItem(FAV_KEY, JSON.stringify(updated));
  };

  return { favIds, removeFav };
}

// ─────────────────────────────────────────────────────────────────────────────
// CURSOR BLOB & BACKGROUND ELEMENTS
// ─────────────────────────────────────────────────────────────────────────────
function CursorBlob() {
  const x  = useMotionValue(0);
  const y  = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 45, damping: 20 });
  const sy = useSpring(y, { stiffness: 45, damping: 20 });

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
        background: 'radial-gradient(circle, rgba(176,142,104,0.07) 0%, rgba(220,38,38,0.04) 45%, transparent 70%)',
        filter: 'blur(50px)',
      }}
    />
  );
}

function Marquee({ text, dir = 1, speed = 55, opacity = 0.05, isDark }: {
  text: string; dir?: number; speed?: number; opacity?: number; isDark: boolean;
}) {
  const rep = Array(12).fill(text).join('  ·  ');
  return (
    <div className="overflow-hidden w-full">
      <motion.p
        className="font-space font-bold uppercase whitespace-nowrap text-xs tracking-[0.22em]"
        style={{ opacity, color: isDark ? '#fff' : '#000' }}
        animate={{ x: dir > 0 ? ['0%', '-50%'] : ['-50%', '0%'] }}
        transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
      >
        {rep}
      </motion.p>
    </div>
  );
}

function Grid({ isDark }: { isDark: boolean }) {
  const color = isDark ? 'rgba(255,255,255,0.035)' : 'rgba(0,91,236,0.04)';
  return (
    <div className="absolute inset-0 pointer-events-none"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(12,1fr)', gridTemplateRows: 'repeat(8,1fr)' }}
    >
      {Array.from({ length: 96 }).map((_, i) => (
        <motion.div key={i} style={{ border: `0.5px solid ${color}` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0, 0.3, 0] }}
          transition={{ duration: 6 + (i % 5), delay: (i * 0.05) % 4, repeat: Infinity }}
        />
      ))}
    </div>
  );
}

function SplitIn({ text, className = '', delay = 0 }: { text: string; className?: string; delay?: number }) {
  return (
    <span className={`inline-flex overflow-hidden ${className}`}>
      {text.split('').map((c, i) => (
        <motion.span key={i} className="inline-block"
          initial={{ y: '110%', opacity: 0, rotateX: -80 }}
          animate={{ y: '0%', opacity: 1, rotateX: 0 }}
          transition={{ duration: 0.65, delay: delay + i * 0.04, ease: EASE_SHARP }}
        >
          {c === ' ' ? '\u00A0' : c}
        </motion.span>
      ))}
    </span>
  );
}

function GlitchText({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={`relative inline-block ${className}`}>
      <motion.span className="absolute inset-0 text-agro-gold select-none"
        style={{ clipPath: 'inset(30% 0 50% 0)' }}
        animate={{ x: [0, -5, 4, -2, 0], opacity: [0, 0.7, 0, 0.5, 0] }}
        transition={{ duration: 4, repeat: Infinity, repeatDelay: 7 }}
      >{text}</motion.span>
      <motion.span className="absolute inset-0 text-red-500 select-none"
        style={{ clipPath: 'inset(60% 0 8% 0)', filter: 'blur(0.5px)' }}
        animate={{ x: [0, 6, -3, 3, 0], opacity: [0, 0.5, 0, 0.4, 0] }}
        transition={{ duration: 4, repeat: Infinity, repeatDelay: 7, delay: 0.07 }}
      >{text}</motion.span>
      {text}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────
function EmptyFavorites() {
  return (
    <motion.div
      className="col-span-full flex flex-col items-center justify-center py-32 gap-6"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5, ease: EASE_BACK }}
    >
      <div className="relative">
        <motion.div
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.12)',
          }}
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            className="text-red-400/40"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </motion.div>
        <motion.div
          className="absolute inset-0 rounded-full border border-red-500/20"
          animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
        />
      </div>

      <div className="text-center space-y-2">
        <p className="font-space font-bold text-2xl uppercase text-agro-blue/40 tracking-tighter">
          Nenhuma peça salva
        </p>
        <p className="font-poppins text-sm text-agro-blue/30 tracking-wider">
          Adicione itens aos favoritos para visualizar aqui.
        </p>
      </div>

      <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }} className="mt-4">
        <Link href="/?skipIntro=true">
          <motion.button
            className="relative px-8 py-4 rounded-2xl font-space font-bold text-sm uppercase tracking-widest overflow-hidden group bg-agro-gold"
            style={{ color: 'var(--color-bg)' }}
            whileHover={{ boxShadow: '0 0 30px 8px rgba(176,142,104,0.25)' }}
          >
            <motion.div
              className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.15) 50%, transparent 80%)',
                backgroundSize: '200% 100%',
              }}
              animate={{ backgroundPositionX: ['200%', '-200%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
            <span className="relative z-10">Explorar Coleção →</span>
          </motion.button>
        </Link>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT CARD (FAVORITES VERSION)
// ─────────────────────────────────────────────────────────────────────────────
function FavCard({ produto, index, onRemove }: { produto: any; index: number; onRemove: () => void }) {
  const isDark = useIsDark();
  const [removing, setRemoving] = useState(false);

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault(); // Impede de abrir o link do produto
    setRemoving(true);
    setTimeout(onRemove, 400);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 40, scale: 0.92 }}
      animate={removing 
        ? { opacity: 0, scale: 0.85, filter: 'blur(4px)' } 
        : { opacity: 1, y: 0, scale: 1 }
      }
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.5, delay: removing ? 0 : index * 0.06, ease: EASE }}
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
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.02)',
              backdropFilter: 'blur(20px) saturate(160%)',
              WebkitBackdropFilter: 'blur(20px) saturate(160%)',
              boxShadow: isDark 
                ? '0 4px 24px rgba(0,0,0,0.2), 0 1px 0 rgba(255,255,255,0.05) inset' 
                : '0 4px 24px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.4) inset',
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

            {/* Remove Button (Heart Break) */}
            <motion.button
              onClick={handleRemove}
              className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-agro-bg/50 backdrop-blur-md border border-agro-blue/10 text-red-500 hover:text-white hover:bg-red-500 hover:border-red-500 transition-all duration-300 shadow-sm"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Remover dos favoritos"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </motion.button>

            {/* Type badge */}
            {produto.type && (
              <motion.span
                className="absolute top-4 left-4 px-2.5 py-1 rounded-full font-poppins font-bold text-[9px] uppercase tracking-widest text-agro-blue/60 border border-agro-blue/15"
                style={{ background: 'rgba(0,91,236,0.06)' }}
              >
                {produto.type}
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
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function FavoritosPage() {
  const isDark = useIsDark();
  const { favIds, removeFav } = useFavorites();

  // Mapeia os IDs salvos para os produtos reais do data/products
  const favoriteProducts = useMemo(() => {
    return products.filter(p => favIds.includes(p.id));
  }, [favIds]);

  return (
    <div className="min-h-screen relative overflow-hidden pb-40 transition-colors duration-500 bg-agro-bg">
      <CursorBlob />

      {/* ── Background ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <Grid isDark={isDark} />
        
        {/* Scanlines */}
        <motion.div className="absolute inset-0"
          style={{
            backgroundImage: isDark
              ? 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.007) 2px,rgba(255,255,255,0.007) 4px)'
              : 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.01) 2px,rgba(0,0,0,0.01) 4px)',
          }}
          animate={{ backgroundPositionY: ['0px','4px'] }}
          transition={{ duration: .14, repeat: Infinity, ease: 'linear' }}
        />

        {/* Big typographic backdrop */}
        <motion.div
          initial={{ opacity: 0, x: -80 }}
          animate={{ opacity: isDark ? 0.03 : 0.04, x: 0 }}
          transition={{ duration: 1.6, ease: EASE }}
          className="absolute top-4 left-[-3%] leading-none select-none"
        >
          <GlitchText
            text="WISH"
            className="font-space font-black text-[14rem] md:text-[20rem] uppercase text-agro-blue"
          />
        </motion.div>

        {/* Marquees */}
        <div className="absolute top-[7%] w-full flex flex-col gap-4">
          <Marquee isDark={isDark} text="AGROTÓXICA  ·  LOTE SELECIONADO  ·  SAFRA 26  ·  TRAIA DE RESPEITO" dir={1} speed={58} opacity={0.05} />
          <Marquee isDark={isDark} text="NA MIRA DO PEÃO  ·  SISTEMA BRUTO  ·  LOTE 2026  ·  CHIQUE NO ÚRTIMO  ·  MOAGEM" dir={-1} speed={44} opacity={0.03} />
        </div>
        <div className="absolute bottom-[6%] w-full flex flex-col gap-4">
          <Marquee isDark={isDark} text="RAIZ GROSSA  ·  AGROTÓXICA  ·  O VENENO DA ROÇA  ·  MARCHA NO TRATOR" dir={-1} speed={52} opacity={0.045} />
        </div>

        {/* Orbit rings */}
        {[400, 700].map((size, i) => (
          <motion.div key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: size, height: size,
              top: '50%', left: '80%',
              marginTop: -size / 2, marginLeft: -size / 2,
              border: i % 2 === 0 ? '1px solid rgba(0,91,236,0.05)' : '1px dashed rgba(220,38,38,0.1)',
            }}
            animate={{ rotate: [0, 360], scale: [0.97, 1.03, 0.97] }}
            transition={{
              rotate: { duration: 25 + i * 15, repeat: Infinity, ease: 'linear' },
              scale:  { duration: 10 + i * 3,  repeat: Infinity, ease: 'easeInOut' },
            }}
          />
        ))}

        {/* Noise grain */}
        <div className="absolute inset-0 mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E")`,
            opacity: 0.4,
          }}
        />
      </div>

      {/* ── Content ── */}
      <div className="container mx-auto px-6 pt-20 pb-10 relative z-10">

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
            <span className="font-poppins text-xs uppercase tracking-[0.22em] text-agro-blue/40">Favoritos</span>
          </motion.div>

          <h1 className="font-space font-black text-5xl md:text-7xl uppercase tracking-tighter leading-none text-agro-blue">
            <SplitIn text="Meus " delay={0.2} />
            <SplitIn text="Favoritos" className="text-agro-gold" delay={0.45} />
          </h1>

          <div className="flex items-center gap-4 mt-4">
            <motion.div
              className="h-[2px] bg-gradient-to-r from-agro-gold via-agro-blue to-transparent rounded-full flex-1 max-w-md"
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 0.9, ease: EASE }}
            />
            {favoriteProducts.length > 0 && (
              <motion.span 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
                className="font-poppins text-xs uppercase tracking-widest text-agro-blue/40 whitespace-nowrap"
              >
                {favoriteProducts.length} itens salvos
              </motion.span>
            )}
          </div>
        </header>

        {/* ── Product grid ── */}
        <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          <AnimatePresence mode="popLayout">
            {favoriteProducts.length > 0
              ? favoriteProducts.map((p, i) => (
                  <FavCard key={p.id} produto={p} index={i} onRemove={() => removeFav(p.id)} />
                ))
              : <EmptyFavorites key="empty" />
            }
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}