'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useCart } from '@/lib/cart';

const EASE      = [0.22, 1, 0.36, 1] as const;
const EASE_BACK = [0.34, 1.56, 0.64, 1] as const;

// ─────────────────────────────────────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────────────────────────────────────
const Icon = {
  Sun: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
      <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
    </svg>
  ),
  Moon: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
  Home: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Store: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  Cart: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  ),
  Heart: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Instagram: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  ),
  Menu: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="4" y1="7"  x2="20" y2="7"/>
      <line x1="4" y1="12" x2="20" y2="12"/>
      <line x1="4" y1="17" x2="20" y2="17"/>
    </svg>
  ),
  Close: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6"  x2="6"  y2="18"/>
      <line x1="6"  y1="6"  x2="18" y2="18"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
};

// ─────────────────────────────────────────────────────────────────────────────
// NAV ITEM ROW
// ─────────────────────────────────────────────────────────────────────────────
type NavItem = {
  id: string;
  icon: () => JSX.Element;
  label: string;
  href: string | null;
  badge: string | null;
};

function NavRow({
  item, active, onSelect, index,
}: {
  item: NavItem;
  active: string | null;
  onSelect: (id: string) => void;
  index: number;
}) {
  const isActive = active === item.id;
  const IconComp = item.icon;

  const inner = (
    <motion.button
      onClick={() => onSelect(item.id)}
      className="relative flex items-center gap-3 w-full rounded-xl px-2.5 py-2.5 group overflow-hidden"
      style={{ background: isActive ? 'rgba(176,142,104,0.12)' : 'transparent' }}
      whileHover={{ x: 3 }}
      whileTap={{ scale: 0.93 }}
      initial={{ opacity: 0, x: -14 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.38, delay: 0.03 * index, ease: EASE }}
    >
      <motion.div
        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-agro-gold"
        animate={{ height: isActive ? '54%' : '0%' }}
        transition={{ duration: 0.28, ease: EASE }}
      />
      <div className="absolute inset-0 rounded-xl bg-agro-blue/[0.05] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div
        className="relative z-10 flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0 transition-all duration-300"
        style={{
          color:      isActive ? '#B08E68' : 'var(--color-blue)',
          background: isActive ? 'rgba(176,142,104,0.12)' : 'rgba(0,91,236,0.07)',
        }}
      >
        <IconComp />
        <AnimatePresence mode="wait">
          {item.badge && (
            <motion.span
              key={item.badge}
              className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-[3px] flex items-center justify-center rounded-full font-space font-bold text-white"
              style={{
                fontSize: 7,
                background: !isNaN(Number(item.badge)) ? '#005BEC' : '#B08E68',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{   scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 14 }}
            >
              {item.badge}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <span
        className="relative z-10 font-space font-bold text-[11px] uppercase tracking-wider whitespace-nowrap text-agro-blue"
        style={{ color: isActive ? '#B08E68' : undefined }}
      >
        {item.label}
      </span>

      <span className="relative z-10 ml-auto opacity-20 group-hover:opacity-50 text-agro-gold transition-opacity">
        <Icon.ChevronRight />
      </span>
    </motion.button>
  );

  if (item.href) {
    return (
      <Link href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}

const glassStyle: React.CSSProperties = {
  background:           'rgba(255,255,255,0.07)',
  backdropFilter:       'blur(28px) saturate(180%)',
  WebkitBackdropFilter: 'blur(28px) saturate(180%)',
  border:               '1px solid rgba(0,91,236,0.12)',
  boxShadow:            '0 8px 40px rgba(0,0,0,0.16), 0 1px 0 rgba(255,255,255,0.06) inset',
};

export default function Hotbar() {
  const [isDark,   setIsDark]   = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [active,   setActive]   = useState<string | null>('home');

  const { count: cartCount } = useCart();

  const NAV_GROUPS: NavItem[][] = [
    [
      { id: 'home',     icon: Icon.Home,      label: 'Início',   href: '/inicio',           badge: null },
      { id: 'vitrine',  icon: Icon.Store,     label: 'Vitrine',  href: '/?skipIntro=true',  badge: 'NEW' },
      { id: 'search',   icon: Icon.Search,    label: 'Buscar',   href: '/busca',            badge: null },
    ],
    [
      {
        id:    'cart',
        icon:  Icon.Cart,
        label: 'Carrinho',
        href:  '/carrinho',
        badge: cartCount > 0 ? String(cartCount > 99 ? '99+' : cartCount) : null,
      },
      { id: 'wishlist', icon: Icon.Heart, label: 'Favoritos', href: '/favoritos', badge: null },
    ],
    [
      { id: 'instagram', icon: Icon.Instagram, label: 'Instagram', href: 'https://instagram.com', badge: null },
    ],
  ];

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    const dark = html.classList.contains('dark');
    dark ? html.classList.remove('dark') : html.classList.add('dark');
    setIsDark(!dark);
  };

  useEffect(() => {
    if (!expanded) return;
    const handler = (e: MouseEvent) => {
      const el = document.getElementById('agro-hotbar');
      if (el && !el.contains(e.target as Node)) setExpanded(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [expanded]);

  return (
    <>
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="fixed inset-0 z-[9997] md:hidden"
            style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setExpanded(false)}
          />
        )}
      </AnimatePresence>

      <div
        id="agro-hotbar"
        className="fixed left-4 top-1/2 -translate-y-1/2 z-[9999]"
        style={{ pointerEvents: 'auto' }}
      >
        <AnimatePresence mode="wait">
          {!expanded && (
            <motion.button
              key="pill"
              onClick={() => setExpanded(true)}
              className="relative flex items-center justify-center rounded-2xl overflow-hidden"
              style={{ width: 46, height: 46, ...glassStyle }}
              initial={{ opacity: 0, x: -24, scale: 0.75 }}
              animate={{ opacity: 1, x: 0,   scale: 1     }}
              exit={{     opacity: 0, x: -24, scale: 0.75 }}
              transition={{ duration: 0.38, ease: EASE_BACK }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(176,142,104,0.16) 0%, transparent 72%)' }}
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span className="relative z-10 text-agro-blue">
                <Icon.Menu />
              </span>
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    className="absolute -top-1 -right-1 min-w-[16px] h-4 px-[3px] flex items-center justify-center rounded-full font-space font-black text-white"
                    style={{ fontSize: 8, background: '#005BEC' }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{   scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 14 }}
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
              <motion.div
                className="absolute inset-0 rounded-2xl border border-agro-gold/25 pointer-events-none"
                animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
              />
            </motion.button>
          )}

          {expanded && (
            <motion.aside
              key="panel"
              className="relative flex flex-col rounded-[22px] overflow-hidden"
              style={{ width: 196, ...glassStyle }}
              initial={{ opacity: 0, x: -30, scale: 0.9 }}
              animate={{ opacity: 1, x: 0,   scale: 1    }}
              exit={{     opacity: 0, x: -30, scale: 0.9 }}
              transition={{ duration: 0.42, ease: EASE }}
            >
              <div className="absolute top-0 inset-x-0 h-16 pointer-events-none rounded-t-[22px]"
                style={{ background: 'linear-gradient(180deg, rgba(176,142,104,0.07) 0%, transparent 100%)' }}
              />
              <div className="absolute inset-0 pointer-events-none rounded-[22px] opacity-[0.025]"
                style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 3px)' }}
              />

              <div className="relative z-10 flex flex-col p-2.5 gap-0.5">
                <div className="flex items-center justify-between px-1 py-1.5 mb-0.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
                      style={{ background: 'rgba(176,142,104,0.12)', border: '1px solid rgba(176,142,104,0.22)' }}
                    >
                      <img src="/assets/logo/logoprincipal.png" alt="Logo"
                        className="w-[18px] h-[18px] object-contain"
                        style={{ filter: 'drop-shadow(0 0 4px rgba(176,142,104,0.5))' }}
                      />
                    </div>
                    <span className="font-space font-black text-[11px] uppercase tracking-[0.12em] text-agro-gold whitespace-nowrap">
                      Agrotóxica
                    </span>
                  </div>
                  <motion.button
                    onClick={() => setExpanded(false)}
                    className="w-6 h-6 flex items-center justify-center rounded-lg text-agro-blue/40 hover:text-agro-blue/80 transition-all"
                    whileTap={{ scale: 0.85 }}
                  >
                    <Icon.Close />
                  </motion.button>
                </div>

                <div className="h-[1px] bg-agro-blue/10 mx-1 mb-1" />

                {NAV_GROUPS.map((group, gi) => (
                  <div key={gi}>
                    {gi > 0 && <div className="h-[1px] bg-agro-blue/[0.08] mx-1 my-0.5" />}
                    {group.map((item, ii) => (
                      <NavRow
                        key={item.id}
                        item={item}
                        active={active}
                        onSelect={(id) => setActive(id)}
                        index={gi * 4 + ii}
                      />
                    ))}
                  </div>
                ))}

                <div className="h-[1px] bg-agro-blue/10 mx-1 my-1" />

                <motion.button
                  onClick={toggleTheme}
                  className="flex items-center gap-3 w-full rounded-xl px-2.5 py-2.5 group relative overflow-hidden"
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.93 }}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.38, delay: 0.24, ease: EASE }}
                >
                  <div className="absolute inset-0 rounded-xl bg-agro-blue/[0.05] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div
                    className="relative z-10 flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0 transition-all duration-500"
                    style={{
                      color:      isDark ? '#B08E68' : 'var(--color-blue)',
                      background: isDark ? 'rgba(176,142,104,0.12)' : 'rgba(0,91,236,0.07)',
                    }}
                  >
                    <AnimatePresence mode="wait">
                      {isDark ? (
                        <motion.span key="sun" initial={{ rotate: -80, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 80, opacity: 0 }} transition={{ duration: 0.22 }}>
                          <Icon.Sun />
                        </motion.span>
                      ) : (
                        <motion.span key="moon" initial={{ rotate: 80, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate:-80, opacity: 0 }} transition={{ duration: 0.22 }}>
                          <Icon.Moon />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <span className="relative z-10 font-space font-bold text-[11px] uppercase tracking-wider text-agro-blue whitespace-nowrap">
                    {isDark ? 'Modo Claro' : 'Modo Escuro'}
                  </span>
                </motion.button>
              </div>
              <div className="absolute bottom-0 inset-x-0 h-10 pointer-events-none rounded-b-[22px]"
                style={{ background: 'linear-gradient(0deg, rgba(0,91,236,0.04) 0%, transparent 100%)' }}
              />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}