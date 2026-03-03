'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  motion, AnimatePresence,
  useMotionValue, useSpring, useTransform,
} from 'framer-motion';
import Link from 'next/link';
import { useCart, type CartItem } from '@/lib/cart';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const E   = [0.22, 1, 0.36, 1]    as const;
const EB  = [0.34, 1.56, 0.64, 1] as const;
const ES  = [0.16, 1, 0.30, 1]    as const;

// ── Cheers checkout URL — troque pela URL real do seu store no Cheers
const CHEERS_URL = 'https://app.cheers.co/checkout';

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
// CURSOR BLOB
// ─────────────────────────────────────────────────────────────────────────────
function CursorBlob() {
  const x  = useMotionValue(0);
  const y  = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 45, damping: 20 });
  const sy = useSpring(y, { stiffness: 45, damping: 20 });
  useEffect(() => {
    const fn = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener('mousemove', fn);
    return () => window.removeEventListener('mousemove', fn);
  }, [x, y]);
  return (
    <motion.div className="fixed pointer-events-none z-0"
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
// MARQUEE
// ─────────────────────────────────────────────────────────────────────────────
function Marquee({ text, dir=1, speed=55, op=0.06, isDark }:{
  text:string; dir?:number; speed?:number; op?:number; isDark:boolean;
}) {
  const rep = Array(12).fill(text).join('  ·  ');
  return (
    <div className="overflow-hidden w-full">
      <motion.p className="font-space font-bold uppercase whitespace-nowrap text-xs tracking-[0.22em]"
        style={{ opacity: op, color: isDark ? '#fff' : '#000' }}
        animate={{ x: dir > 0 ? ['0%','-50%'] : ['-50%','0%'] }}
        transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
      >{rep}</motion.p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SPLIT TITLE
// ─────────────────────────────────────────────────────────────────────────────
function SplitIn({ text, className='', delay=0 }:{ text:string; className?:string; delay?:number }) {
  return (
    <span className={`inline-flex overflow-hidden ${className}`}>
      {text.split('').map((c, i) => (
        <motion.span key={i} className="inline-block"
          initial={{ y: '110%', opacity: 0, rotateX: -80 }}
          animate={{ y: '0%', opacity: 1, rotateX: 0 }}
          transition={{ duration: 0.65, delay: delay + i * 0.04, ease: ES }}
        >{c === ' ' ? '\u00A0' : c}</motion.span>
      ))}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED GRID (subtle)
// ─────────────────────────────────────────────────────────────────────────────
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
          transition={{ duration: 6+(i%5), delay: (i*.05)%4, repeat: Infinity }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMAT PRICE
// ─────────────────────────────────────────────────────────────────────────────
function fmtBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ─────────────────────────────────────────────────────────────────────────────
// QUANTITY CONTROL
// ─────────────────────────────────────────────────────────────────────────────
function QtyControl({ qty, onInc, onDec }: { qty: number; onInc: ()=>void; onDec: ()=>void }) {
  return (
    <div className="flex items-center gap-0 rounded-xl overflow-hidden"
      style={{ border: '1px solid rgba(176,142,104,0.25)' }}
    >
      <motion.button onClick={onDec}
        className="w-8 h-8 flex items-center justify-center font-space font-bold text-agro-blue hover:text-agro-gold hover:bg-agro-gold/10 transition-all"
        whileTap={{ scale: 0.85 }}
      >−</motion.button>
      <AnimatePresence mode="wait">
        <motion.span key={qty}
          className="w-8 h-8 flex items-center justify-center font-space font-bold text-sm text-agro-blue"
          initial={{ opacity: 0, y: -8, scale: 0.7 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.7 }}
          transition={{ duration: 0.2, ease: EB }}
        >{qty}</motion.span>
      </AnimatePresence>
      <motion.button onClick={onInc}
        className="w-8 h-8 flex items-center justify-center font-space font-bold text-agro-blue hover:text-agro-gold hover:bg-agro-gold/10 transition-all"
        whileTap={{ scale: 0.85 }}
      >+</motion.button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CART ITEM ROW
// ─────────────────────────────────────────────────────────────────────────────
function CartRow({ item, index, onRemove, onQty }: {
  item: CartItem;
  index: number;
  onRemove: () => void;
  onQty: (qty: number) => void;
}) {
  const isDark = useIsDark();
  const [removing, setRemoving] = useState(false);

  const handleRemove = () => {
    setRemoving(true);
    setTimeout(onRemove, 400);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -40, scale: 0.95 }}
      animate={removing
        ? { opacity: 0, x: 60, scale: 0.9, filter: 'blur(4px)' }
        : { opacity: 1, x: 0, scale: 1 }
      }
      exit={{ opacity: 0, x: 60, scale: 0.9, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.45, delay: removing ? 0 : index * 0.07, ease: E }}
      className="group relative rounded-3xl overflow-hidden transition-all duration-300"
      style={{
        background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        border: '1px solid rgba(176,142,104,0.12)',
        boxShadow: isDark
          ? '0 4px 24px rgba(0,0,0,0.25), 0 1px 0 rgba(255,255,255,0.03) inset'
          : '0 4px 24px rgba(0,0,0,0.05), 0 1px 0 rgba(255,255,255,0.7) inset',
      }}
      whileHover={{ borderColor: 'rgba(176,142,104,0.3)' }}
    >
      {/* Hover shimmer */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500"
        style={{
          background: 'linear-gradient(105deg, transparent 30%, rgba(176,142,104,0.04) 50%, transparent 70%)',
          backgroundSize: '200% 100%',
        }}
        animate={{ backgroundPositionX: ['200%', '-200%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      />

      {/* Delete sweep on remove */}
      {removing && (
        <motion.div
          className="absolute inset-0 z-20 pointer-events-none"
          style={{ background: 'rgba(176,142,104,0.08)' }}
          initial={{ scaleX: 0, originX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.35, ease: ES }}
        />
      )}

      <div className="flex items-center gap-5 p-5">
        {/* Image */}
        <motion.div
          className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0 rounded-2xl overflow-hidden flex items-center justify-center"
          style={{
            background: 'rgba(176,142,104,0.07)',
            border: '1px solid rgba(176,142,104,0.15)',
          }}
          whileHover={{ scale: 1.08 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-400"
            style={{ background: 'radial-gradient(circle, rgba(176,142,104,0.15) 0%, transparent 70%)' }}
          />
          <img src={item.image} alt={item.nome}
            className="w-full h-full object-contain p-2"
          />
          {/* Qty badge */}
          {item.qty > 1 && (
            <motion.div
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center font-space font-black text-[9px] text-white"
              style={{ background: '#005BEC' }}
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 14 }}
            >{item.qty}</motion.div>
          )}
        </motion.div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-space font-black text-xl md:text-2xl uppercase tracking-tighter leading-none text-agro-blue truncate">
                {item.nome}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {item.color && (
                  <span className="font-poppins text-[10px] uppercase tracking-[0.2em] text-agro-gold/70">{item.color}</span>
                )}
                {item.size && (
                  <>
                    <span className="text-agro-blue/20 text-[10px]">·</span>
                    <span className="font-poppins text-[10px] uppercase tracking-[0.2em] text-agro-blue/50">{item.size}</span>
                  </>
                )}
              </div>
            </div>
            {/* Remove btn */}
            <motion.button
              onClick={handleRemove}
              className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-agro-blue/25 hover:text-red-400 hover:bg-red-400/10 transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.85 }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </motion.button>
          </div>

          <div className="flex items-center justify-between mt-3">
            <QtyControl
              qty={item.qty}
              onInc={() => onQty(item.qty + 1)}
              onDec={() => onQty(item.qty - 1)}
            />
            <div className="text-right">
              <motion.p
                key={item.qty}
                className="font-space font-black text-xl text-agro-gold leading-none"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: EB }}
              >
                {fmtBRL(item.priceNum * item.qty)}
              </motion.p>
              {item.qty > 1 && (
                <p className="font-poppins text-[10px] text-agro-blue/30 tracking-wider mt-0.5">
                  {fmtBRL(item.priceNum)} cada
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY CART STATE
// ─────────────────────────────────────────────────────────────────────────────
function EmptyCart() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-32 gap-8"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: EB }}
    >
      {/* Animated bag icon */}
      <div className="relative">
        <motion.div
          className="w-28 h-28 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(176,142,104,0.07)', border: '1px solid rgba(176,142,104,0.15)' }}
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
            className="text-agro-blue/25"
          >
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
        </motion.div>
        {/* Pulse rings */}
        {[1, 1.4, 1.8].map((scale, i) => (
          <motion.div key={i}
            className="absolute inset-0 rounded-full border border-agro-gold/15 pointer-events-none"
            animate={{ scale: [1, scale, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2.5, delay: i * 0.5, repeat: Infinity, ease: 'easeOut' }}
          />
        ))}
      </div>

      <div className="text-center space-y-2">
        <p className="font-space font-black text-3xl uppercase tracking-tighter text-agro-blue/40">
          Carrinho vazio
        </p>
        <p className="font-poppins text-sm text-agro-blue/25 tracking-wider">
          Adicione peças da nossa coleção 2026
        </p>
      </div>

      <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}>
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
// ORDER SUMMARY PANEL
// ─────────────────────────────────────────────────────────────────────────────
function OrderSummary({ items, total, isDark, onCheckout }: {
  items: CartItem[];
  total: number;
  isDark: boolean;
  onCheckout: () => void;
}) {
  const subtotal  = total;
  const shipping  = total > 0 ? 0 : 0; // frete grátis (ajustar se necessário)
  const itemCount = items.reduce((acc, i) => acc + i.qty, 0);

  return (
    <motion.div
      className="sticky top-8 rounded-3xl overflow-hidden"
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.3, ease: E }}
      style={{
        background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid rgba(176,142,104,0.18)',
        boxShadow: isDark
          ? '0 8px 40px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.03) inset'
          : '0 8px 40px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.8) inset',
      }}
    >
      {/* Top glow */}
      <div className="absolute top-0 inset-x-0 h-20 pointer-events-none rounded-t-3xl"
        style={{ background: 'linear-gradient(180deg, rgba(176,142,104,0.08) 0%, transparent 100%)' }}
      />

      {/* Scanline */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.025] rounded-3xl"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 3px)' }}
      />

      <div className="relative z-10 p-6 flex flex-col gap-5">
        {/* Header */}
        <div>
          <p className="font-poppins text-[10px] uppercase tracking-[0.35em] text-agro-gold/60 mb-1">— Resumo</p>
          <h3 className="font-space font-black text-2xl uppercase tracking-tighter text-agro-blue">do Pedido</h3>
        </div>

        <div className="h-[1px]" style={{ background: 'linear-gradient(to right, rgba(176,142,104,0.3), transparent)' }} />

        {/* Line items */}
        <div className="flex flex-col gap-3">
          {items.map(item => (
            <motion.div key={`${item.id}-${item.color}-${item.size}`}
              layout
              className="flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0"
                  style={{ background: 'rgba(176,142,104,0.08)', border: '1px solid rgba(176,142,104,0.15)' }}
                >
                  <img src={item.image} alt={item.nome} className="w-full h-full object-contain p-1" />
                </div>
                <div className="min-w-0">
                  <p className="font-space font-bold text-xs uppercase tracking-tight text-agro-blue truncate leading-none">{item.nome}</p>
                  <p className="font-poppins text-[9px] text-agro-blue/40 tracking-wider">x{item.qty}</p>
                </div>
              </div>
              <p className="font-space font-bold text-sm text-agro-gold flex-shrink-0">{fmtBRL(item.priceNum * item.qty)}</p>
            </motion.div>
          ))}
        </div>

        <div className="h-[1px]" style={{ background: 'rgba(176,142,104,0.12)' }} />

        {/* Totals */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="font-poppins text-xs uppercase tracking-wider text-agro-blue/40">Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'itens'})</span>
            <span className="font-space font-bold text-sm text-agro-blue">{fmtBRL(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-poppins text-xs uppercase tracking-wider text-agro-blue/40">Frete</span>
            <span className="font-poppins text-xs font-bold text-green-500 tracking-wider">A calcular</span>
          </div>
        </div>

        <div className="h-[1px]" style={{ background: 'rgba(176,142,104,0.18)' }} />

        {/* Total */}
        <div className="flex justify-between items-end">
          <span className="font-space font-bold text-sm uppercase tracking-widest text-agro-blue/50">Total</span>
          <div className="text-right">
            <motion.p
              key={total}
              className="font-space font-black text-3xl text-agro-gold leading-none"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: EB }}
            >{fmtBRL(total)}</motion.p>
            <p className="font-poppins text-[9px] text-agro-blue/30 tracking-wider mt-0.5">+ frete a calcular</p>
          </div>
        </div>

        {/* Cheers CTA */}
        <motion.button
          onClick={onCheckout}
          disabled={items.length === 0}
          className="relative w-full py-4 rounded-2xl font-space font-bold text-base uppercase tracking-[0.15em] overflow-hidden group"
          style={{
            background: items.length > 0 ? '#B08E68' : 'rgba(176,142,104,0.2)',
            color: items.length > 0 ? 'var(--color-bg)' : 'rgba(176,142,104,0.4)',
            cursor: items.length > 0 ? 'pointer' : 'not-allowed',
          }}
          whileHover={items.length > 0 ? { scale: 1.02, boxShadow: '0 0 40px 10px rgba(176,142,104,0.3)' } : {}}
          whileTap={items.length > 0 ? { scale: 0.97 } : {}}
          animate={items.length > 0 ? {
            boxShadow: ['0 0 0px rgba(176,142,104,0)', '0 0 25px 6px rgba(176,142,104,0.2)', '0 0 0px rgba(176,142,104,0)'],
          } : {}}
          transition={{ boxShadow: { duration: 2.5, repeat: Infinity } }}
        >
          {/* Shine sweep */}
          {items.length > 0 && (
            <motion.div
              className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.2) 50%, transparent 80%)',
                backgroundSize: '200% 100%',
              }}
              animate={{ backgroundPositionX: ['200%', '-200%'] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          )}
          <span className="relative z-10 flex items-center justify-center gap-2">
            Finalizar no Cheers
            {items.length > 0 && (
              <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>→</motion.span>
            )}
          </span>
        </motion.button>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4">
          {['🔒 Seguro', '⚡ Rápido', '✓ Exclusivo'].map(t => (
            <span key={t} className="font-poppins text-[9px] uppercase tracking-wider text-agro-blue/25">{t}</span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHECKOUT TRANSITION (Venetian blind)
// ─────────────────────────────────────────────────────────────────────────────
function CheckoutTransition({ active }: { active: boolean }) {
  const STRIPS = 8;
  return (
    <AnimatePresence>
      {active && (
        <div className="fixed inset-0 z-[10000] pointer-events-none">
          {Array.from({ length: STRIPS }).map((_, i) => (
            <motion.div key={i}
              className="absolute left-0 w-full"
              style={{
                height: `${100 / STRIPS + 0.3}%`,
                top: `${(i / STRIPS) * 100}%`,
                background: i % 2 === 0 ? '#B08E68' : '#8a6e4e',
              }}
              initial={{ scaleY: 0, transformOrigin: 'top' }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.35, delay: i * 0.05, ease: ES }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CLEAR CONFIRM MODAL
// ─────────────────────────────────────────────────────────────────────────────
function ClearModal({ onConfirm, onCancel }: { onConfirm: ()=>void; onCancel: ()=>void }) {
  return (
    <motion.div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
        onClick={onCancel}
      />
      <motion.div
        className="relative rounded-3xl p-8 flex flex-col items-center gap-6 max-w-sm w-full"
        style={{
          background: 'var(--color-card)',
          border: '1px solid rgba(176,142,104,0.25)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: EB }}
      >
        <div className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.5" strokeLinecap="round" className="text-red-400"
          >
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          </svg>
        </div>
        <div className="text-center">
          <p className="font-space font-black text-xl uppercase tracking-tight text-agro-blue">Limpar carrinho?</p>
          <p className="font-poppins text-sm text-agro-blue/50 mt-1">Todos os itens serão removidos.</p>
        </div>
        <div className="flex gap-3 w-full">
          <motion.button onClick={onCancel}
            className="flex-1 py-3 rounded-2xl font-space font-bold text-xs uppercase tracking-widest text-agro-blue/50 border border-agro-blue/15 hover:border-agro-blue/30 transition-all"
            whileTap={{ scale: 0.95 }}
          >Cancelar</motion.button>
          <motion.button onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl font-space font-bold text-xs uppercase tracking-widest text-white bg-red-500 hover:bg-red-600 transition-all"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}
          >Limpar</motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function CarrinhoPage() {
  const { items, total, count, removeItem, updateQty, clearCart } = useCart();
  const isDark   = useIsDark();
  const [exiting, setExiting]   = useState(false);
  const [showClear, setShowClear] = useState(false);

  // Build Cheers payload and redirect
  const handleCheckout = useCallback(() => {
    if (items.length === 0) return;

    // Build query string with cart data for Cheers
    const payload = {
      store:    'agrotoxica-2026',
      items:    items.map(i => ({
        id:    i.id,
        nome:  i.nome,
        price: i.priceNum,
        qty:   i.qty,
        color: i.color,
        size:  i.size,
        image: i.image,
      })),
      total,
      currency: 'BRL',
    };

    const encoded = btoa(encodeURIComponent(JSON.stringify(payload)));

    setExiting(true);
    setTimeout(() => {
      window.open(`${CHEERS_URL}?cart=${encoded}`, '_blank');
      setExiting(false);
    }, 700);
  }, [items, total]);

  return (
    <div className="min-h-screen bg-agro-bg transition-colors duration-500 overflow-hidden relative pb-32">
      <CursorBlob />

      {/* Background */}
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

        {/* Typographic backdrop */}
        <motion.div
          className="absolute top-4 left-[-3%] leading-none select-none pointer-events-none"
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: isDark ? 0.03 : 0.035, x: 0 }}
          transition={{ duration: 1.6, ease: E }}
        >
          <span className="font-space font-black text-[14rem] md:text-[20rem] uppercase text-agro-blue">
            CART
          </span>
        </motion.div>

        {/* Orbit rings */}
        {[300, 550, 800].map((size, i) => (
          <motion.div key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: size, height: size,
              top: '45%', left: '65%',
              marginTop: -size/2, marginLeft: -size/2,
              border: i%2===0
                ? `1px solid rgba(0,91,236,0.05)`
                : `1px dashed rgba(176,142,104,0.08)`,
            }}
            animate={{ rotate: [0, 360], scale: [.97, 1.03, .97] }}
            transition={{
              rotate: { duration: 20+i*12, repeat: Infinity, ease: 'linear' },
              scale:  { duration: 8+i*2,   repeat: Infinity, ease: 'easeInOut' },
            }}
          />
        ))}

        {/* Marquees */}
<div className="absolute top-[7%] w-full flex flex-col gap-4">
          <Marquee isDark={isDark} text="AGROTÓXICA  ·  LOTE NO CARRINHO  ·  SAFRA 26  ·  TRAIA DE RESPEITO  ·  FECHAR O NEGÓCIO" dir={1} speed={60} op={.055} />
          <Marquee isDark={isDark} text="RAIZ GROSSA  ·  SISTEMA BRUTO  ·  MOAGEM  ·  LOTE RESTRITO  ·  O VENENO DA ROÇA" dir={-1} speed={45} op={.035} />
        </div>
        <div className="absolute bottom-[6%] w-full flex flex-col gap-4">
          <Marquee isDark={isDark} text="PAGAR O BOLETO  ·  TCHAU BRIGADO  ·  AGROTÓXICA  ·  2026  ·  AGUENTA O TRANCO" dir={-1} speed={52} op={.05} />
        </div>

        {/* Noise grain */}
        <div className="absolute inset-0 mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E")`,
            opacity: .4,
          }}
        />
      </div>

      {/* ── CONTENT ── */}
      <div className="container mx-auto px-6 md:px-12 pt-20 relative z-10">

        {/* Header */}
        <header className="mb-12">
          <motion.div className="flex items-center gap-3 mb-4"
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Link href="/?skipIntro=true"
              className="font-poppins text-xs font-bold uppercase tracking-[0.22em] text-agro-gold hover:opacity-60 transition-opacity flex items-center gap-2"
            >← Voltar</Link>
            <span className="text-agro-blue/20 text-xs">/</span>
            <span className="font-poppins text-xs uppercase tracking-[0.22em] text-agro-blue/40">Carrinho</span>
          </motion.div>

          <div className="flex items-end justify-between flex-wrap gap-4">
            <h1 className="font-space font-black text-5xl md:text-7xl uppercase tracking-tighter leading-none text-agro-blue">
              <SplitIn text="Meu " delay={0.2} />
              <SplitIn text="Carrinho" className="text-agro-gold" delay={0.38} />
            </h1>

            <div className="flex items-center gap-4">
              {/* Item count */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={count}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(176,142,104,0.08)', border: '1px solid rgba(176,142,104,0.2)' }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.25, ease: EB }}
                >
                  <motion.div className="w-1.5 h-1.5 rounded-full bg-agro-gold"
                    animate={{ scale: [1, 1.5, 1], opacity: [1, .4, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                  />
                  <span className="font-space font-bold text-[11px] uppercase tracking-widest text-agro-gold">
                    {count} {count === 1 ? 'item' : 'itens'}
                  </span>
                </motion.div>
              </AnimatePresence>

              {/* Clear button */}
              {items.length > 0 && (
                <motion.button
                  onClick={() => setShowClear(true)}
                  className="font-poppins text-xs uppercase tracking-[0.2em] text-agro-blue/25 hover:text-red-400 transition-colors flex items-center gap-1.5"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  </svg>
                  Limpar tudo
                </motion.button>
              )}
            </div>
          </div>

          {/* Underline */}
          <motion.div
            className="h-[2px] mt-4 rounded-full"
            style={{ background: 'linear-gradient(to right, rgba(176,142,104,0.5), rgba(0,91,236,0.2), transparent)', width: '40%' }}
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.7, ease: E }}
          />
        </header>

        {/* ── MAIN LAYOUT ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">

          {/* Items list */}
          <div>
            <AnimatePresence mode="popLayout">
              {items.length === 0
                ? <EmptyCart key="empty" />
                : (
                  <motion.div layout className="flex flex-col gap-4">
                    {items.map((item, i) => (
                      <CartRow
                        key={`${item.id}-${item.color ?? ''}-${item.size ?? ''}`}
                        item={item}
                        index={i}
                        onRemove={() => removeItem(item.id, item.color, item.size)}
                        onQty={(qty) => updateQty(item.id, qty, item.color, item.size)}
                      />
                    ))}

                    {/* Continue shopping */}
                    <motion.div
                      layout
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="pt-2"
                    >
                      <Link href="/?skipIntro=true">
                        <motion.button
                          className="flex items-center gap-2 font-poppins text-xs uppercase tracking-[0.2em] text-agro-blue/35 hover:text-agro-gold transition-colors"
                          whileHover={{ x: 4 }}
                          transition={{ duration: 0.2 }}
                        >
                          <span className="text-agro-gold">←</span>
                          Continuar comprando
                        </motion.button>
                      </Link>
                    </motion.div>
                  </motion.div>
                )
              }
            </AnimatePresence>
          </div>

          {/* Summary */}
          <div>
            <AnimatePresence>
              {items.length > 0 && (
                <OrderSummary
                  items={items}
                  total={total}
                  isDark={isDark}
                  onCheckout={handleCheckout}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Checkout venetian transition */}
      <CheckoutTransition active={exiting} />

      {/* Clear modal */}
      <AnimatePresence>
        {showClear && (
          <ClearModal
            onConfirm={() => { clearCart(); setShowClear(false); }}
            onCancel={() => setShowClear(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}