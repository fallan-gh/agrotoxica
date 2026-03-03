'use client';
import { motion, useMotionValue, useSpring, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { products } from '../../../data/products';
import { useState, useEffect, use, useRef } from 'react';
import Link from 'next/link';
import { useCart } from '../../../lib/cart'; 

const easeInOut = [0.25, 0.1, 0.25, 1];

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: easeInOut } }
};

// ── Typewriter Hook ──────────────────────────────────────────────────────────
function useTypewriter(phrases: string[], speed = 80, pause = 1800) {
  const [display, setDisplay] = useState('');
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[phraseIdx];
    let timeout: ReturnType<typeof setTimeout>;

    if (!deleting && charIdx < current.length) {
      timeout = setTimeout(() => setCharIdx((c) => c + 1), speed);
    } else if (!deleting && charIdx === current.length) {
      timeout = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && charIdx > 0) {
      timeout = setTimeout(() => setCharIdx((c) => c - 1), speed / 2);
    } else if (deleting && charIdx === 0) {
      setDeleting(false);
      setPhraseIdx((i) => (i + 1) % phrases.length);
    }

    setDisplay(current.slice(0, charIdx));
    return () => clearTimeout(timeout);
  }, [charIdx, deleting, phraseIdx, phrases, speed, pause]);

  return display;
}

// ── Floating Letter ──────────────────────────────────────────────────────────
function FloatingLetter({ char, delay, x, y }: { char: string; delay: number; x: number; y: number }) {
  return (
    <motion.span
      className="absolute font-space font-black text-agro-blue select-none pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, fontSize: `${Math.random() * 80 + 20}px` }}
      initial={{ opacity: 0, scale: 0, rotate: -30 }}
      animate={{
        opacity: [0, 0.07, 0.04, 0.08, 0],
        scale: [0.5, 1.2, 0.9, 1.1, 0.8],
        rotate: [0, 15, -10, 20, 5],
        y: [0, -40, 20, -20, 0],
      }}
      transition={{
        duration: 12 + delay * 2,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {char}
    </motion.span>
  );
}

// ── Scanline overlay ─────────────────────────────────────────────────────────
function Scanlines() {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none z-0"
      style={{
        backgroundImage:
          'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.015) 2px, rgba(0,0,0,0.015) 4px)',
      }}
      animate={{ backgroundPositionY: ['0px', '4px'] }}
      transition={{ duration: 0.12, repeat: Infinity, ease: 'linear' }}
    />
  );
}

// ── Marquee strip ────────────────────────────────────────────────────────────
function Marquee({ text, direction = 1, speed = 60, opacity = 0.06 }: {
  text: string; direction?: number; speed?: number; opacity?: number;
}) {
  const repeated = Array(12).fill(text).join('  ·  ');
  return (
    <div className="overflow-hidden w-full">
      <motion.p
        className="font-space font-bold uppercase whitespace-nowrap text-agro-blue text-lg tracking-[0.3em]"
        style={{ opacity }}
        animate={{ x: direction > 0 ? ['0%', '-50%'] : ['-50%', '0%'] }}
        transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
      >
        {repeated}
      </motion.p>
    </div>
  );
}

// ── Split-letter animated heading ────────────────────────────────────────────
function SplitLetterText({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={`inline-flex overflow-hidden ${className}`}>
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ y: '120%', opacity: 0 }}
          whileInView={{ y: '0%', opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
}

// ── Glitch text ───────────────────────────────────────────────────────────────
function GlitchText({ text, className = '' }: { text: string; className?: string }) {
  return (
    <div className={`relative inline-block ${className}`}>
      <motion.span
        className="absolute top-0 left-0 text-agro-gold"
        style={{ clipPath: 'inset(20% 0 60% 0)' }}
        animate={{ x: [0, -4, 3, -2, 0], opacity: [0, 0.7, 0, 0.5, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 4 }}
      >{text}</motion.span>
      <motion.span
        className="absolute top-0 left-0 text-agro-blue"
        style={{ clipPath: 'inset(65% 0 10% 0)', filter: 'blur(0.5px)' }}
        animate={{ x: [0, 5, -3, 2, 0], opacity: [0, 0.6, 0, 0.4, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 4, delay: 0.05 }}
      >{text}</motion.span>
      <span>{text}</span>
    </div>
  );
}

// ── Animated grid ─────────────────────────────────────────────────────────────
function AnimatedGrid() {
  const cols = 12;
  const rows = 8;
  return (
    <div
      className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
      }}
    >
      {Array.from({ length: cols * rows }).map((_, i) => (
        <motion.div
          key={i}
          className="border-[0.5px] border-agro-blue"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.04, 0, 0.02, 0] }}
          transition={{
            duration: 4 + (i % 5),
            delay: (i * 0.07) % 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ── Orbiting ring ─────────────────────────────────────────────────────────────
function OrbitRing({ size, delay, duration }: { size: number; delay: number; duration: number }) {
  return (
    <motion.div
      className="absolute rounded-full border border-agro-gold pointer-events-none"
      style={{
        width: size,
        height: size,
        top: '50%',
        left: '50%',
        marginTop: -size / 2,
        marginLeft: -size / 2,
      }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{
        opacity: [0, 0.12, 0.06, 0.1, 0],
        scale: [0.8, 1.05, 0.95, 1.02, 0.8],
        rotate: [0, 360],
      }}
      transition={{
        opacity: { duration: duration * 0.5, repeat: Infinity, delay },
        scale: { duration: duration * 0.3, repeat: Infinity, delay },
        rotate: { duration, repeat: Infinity, ease: 'linear', delay },
      }}
    />
  );
}

// ── Cursor blob ───────────────────────────────────────────────────────────────
function CursorBlob() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 60, damping: 20 });
  const springY = useSpring(y, { stiffness: 60, damping: 20 });

  useEffect(() => {
    const move = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [x, y]);

  return (
    <motion.div
      className="fixed pointer-events-none z-0"
      style={{
        x: springX,
        y: springY,
        translateX: '-50%',
        translateY: '-50%',
        width: 600,
        height: 600,
        borderRadius: '50%',
        background:
          'radial-gradient(circle, rgba(176,142,104,0.08) 0%, rgba(0,91,236,0.04) 50%, transparent 70%)',
        filter: 'blur(40px)',
      }}
    />
  );
}

// ── Background ─────────────────────────────────────────────────────────────────
function AdvancedBackground({ nomeProduto, tipoProduto }: { nomeProduto: string; tipoProduto: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);

  const typewriterText = useTypewriter([
    'ALTA PERFORMANCE',
    'TECNOLOGIA AGRO',
    'COLEÇÃO 2026',
    'SÍNTESE ATIVA',
    'ESTRUTURA DE SAFRA',
    nomeProduto.toUpperCase(),
  ]);

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const floatingLetters = Array.from({ length: 18 }, (_, i) => ({
    char: (nomeProduto + tipoProduto + alphabet)[i % (nomeProduto.length + tipoProduto.length + alphabet.length)],
    delay: i * 0.7,
    x: (i * 17 + 5) % 95,
    y: (i * 13 + 3) % 90,
  }));

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <CursorBlob />
      <AnimatedGrid />
      <Scanlines />

      <OrbitRing size={400} delay={0} duration={18} />
      <OrbitRing size={700} delay={1.5} duration={28} />
      <OrbitRing size={1000} delay={3} duration={40} />

      <motion.div style={{ y: bgY }} className="absolute inset-0">
        <motion.h1
          initial={{ opacity: 0, x: -120 }}
          animate={{ opacity: 0.05, x: 0 }}
          transition={{ duration: 1.4, ease: easeInOut }}
          className="font-space font-black absolute top-10 left-[-5%] text-[10rem] md:text-[16rem] uppercase whitespace-nowrap z-0 leading-none text-agro-blue"
        >
          <GlitchText text={`${tipoProduto} AGROTÓXICA`} />
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, rotate: -6, x: '20%' }}
          animate={{ opacity: 0.03, rotate: -6, x: '5%' }}
          transition={{ duration: 2, delay: 0.6 }}
          className="font-space font-black absolute top-[38%] text-[8rem] uppercase whitespace-nowrap text-agro-gold leading-none"
        >
          {nomeProduto} · {nomeProduto} · {nomeProduto}
        </motion.p>
      </motion.div>

      {floatingLetters.map((l, i) => (
        <FloatingLetter key={i} {...l} />
      ))}

      <div className="absolute top-[10%] w-full flex flex-col gap-6">
        <Marquee text={`${nomeProduto}  ·  DOMÍNIO TERRITORIAL  ·  2026  ·  COLEÇÃO PREMIUM`} direction={1} speed={55} opacity={0.06} />
        <Marquee text={`ALTA PERFORMANCE  ·  TOXICIDADE CONTROLADA  ·  PROTEÇÃO MÁXIMA  ·  WEAR THE CALOURO`} direction={-1} speed={45} opacity={0.04} />
      </div>
      <div className="absolute bottom-[12%] w-full flex flex-col gap-6">
        <Marquee text={`MECANISMO DE CAMPO  ·  REAÇÃO EM CADEIA  ·  ESTILO  ·  ${nomeProduto}  ·  SAFRA 2026`} direction={-1} speed={50} opacity={0.05} />
        <Marquee text={`SUPREMACIA TÉCNICA  ·  ZONA DE IMPACTO  ·  ${tipoProduto}  ·  AGROTÓXICA  ·  MADE TO LAST`} direction={1} speed={65} opacity={0.035} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-8 z-10"
      >
        <div className="flex items-center gap-3">
          <motion.div
            className="w-2 h-2 rounded-full bg-agro-gold"
            animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          <span className="font-poppins text-xs uppercase tracking-[0.25em] opacity-40 text-agro-blue">
            {typewriterText}
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="inline-block ml-0.5 border-r-2 border-agro-gold h-[0.9em] align-middle"
            />
          </span>
        </div>
      </motion.div>

      {[
        { top: '5%', left: '2%' },
        { top: '5%', right: '2%' },
        { bottom: '5%', left: '2%' },
        { bottom: '5%', right: '2%' },
      ].map((pos, i) => (
        <motion.svg
          key={i}
          width="24"
          height="24"
          viewBox="0 0 24 24"
          className="absolute text-agro-gold"
          style={{ ...pos, opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0.15, 0.3], rotate: [0, 90, 180, 270, 360] }}
          transition={{ duration: 20, repeat: Infinity, delay: i * 1.5, ease: 'linear' }}
        >
          <line x1="12" y1="0" x2="12" y2="24" stroke="currentColor" strokeWidth="1.5" />
          <line x1="0" y1="12" x2="24" y2="12" stroke="currentColor" strokeWidth="1.5" />
        </motion.svg>
      ))}

      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 0.15, x: 0 }}
        transition={{ delay: 2, duration: 1.2 }}
        className="absolute top-20 right-6 flex flex-col gap-1 items-end"
      >
        {['01', '02', '03', '04', '05'].map((n, i) => (
          <motion.span
            key={n}
            className="font-space font-bold text-xs tracking-widest text-agro-gold"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 3, delay: i * 0.6, repeat: Infinity }}
          >
            {n}
          </motion.span>
        ))}
      </motion.div>

      <div
        className="absolute inset-0 pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
          opacity: 0.4,
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function ProductPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const produto = products.find((p) => String(p.id) === String(params.id));
  
  const [selectedColor, setSelectedColor] = useState('');
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (produto) {
      setSelectedColor(produto.cores?.[0] || '');
      import('@google/model-viewer');
    }
  }, [produto]);

  if (!produto) return null;

  // 🛡️ Lógica para obter a galeria correta e o modelo 3D baseado na cor
  const currentGallery = produto.galeria 
    ? (Array.isArray(produto.galeria) ? produto.galeria : (produto.galeria as any)[selectedColor] || [])
    : [];

  const currentModel = typeof produto.model3d === 'string' 
    ? produto.model3d 
    : produto.model3d[selectedColor];

  const handleAddToCart = () => {
    if (isAdding) return;
    setIsAdding(true);
    addItem({
      id: produto.id,
      nome: produto.nome,
      price: produto.price,
      image: produto.image,
      color: selectedColor,
      qty: 1
    });
    setTimeout(() => setIsAdding(false), 1500);
  };

  return (
    <div className="min-h-screen overflow-hidden relative pb-32 transition-colors duration-500">

      <AdvancedBackground nomeProduto={produto.nome} tipoProduto={produto.type} />

      <div className="container mx-auto px-6 py-20 relative z-10 min-h-screen flex flex-col justify-center">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Lado Esquerdo: Vitrine 3D Dinâmica */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotateY: 15 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1.2, ease: easeInOut }}
            className="w-full h-[50vh] lg:h-[75vh] bg-gradient-to-br from-agro-blue/10 to-transparent border border-agro-blue/20 rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden relative flex flex-col items-center justify-center transition-all duration-500"
          >
            <model-viewer
              key={currentModel} // Força o re-render ao trocar a cor
              src={currentModel}
              alt={`Modelo 3D de ${produto.nome}`}
              auto-rotate
              camera-controls
              exposure="0.6"
              shadow-intensity="1.5"
              shadow-softness="1"
              environment-image="neutral"
              style={{ width: '100%', height: 'calc(100% - 30px)' }} // Ajuste leve de altura
            >
              <div slot="poster" className="absolute inset-0 flex flex-col items-center justify-center font-bold text-2xl font-poppins text-center px-4">
                <span className="opacity-50 text-agro-blue uppercase tracking-widest text-sm animate-pulse">
                  Sincronizando {produto.nome} ({selectedColor})...
                </span>
              </div>
            </model-viewer>
            
            {/* Texto Disclaimer */}
            <span className="font-poppins text-xs uppercase tracking-widest text-agro-blue opacity-60 mt-2 pb-2">
              imagens meramente ilustrativas
            </span>
          </motion.div>

          {/* Lado Direito: Informações */}
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col space-y-8">
            <motion.div variants={fadeUp}>
              <Link href="/?skipIntro=true" className="text-sm font-poppins font-bold uppercase text-agro-gold hover:opacity-70 transition-colors mb-4 inline-flex items-center gap-2">
                <span>←</span> Voltar para a Vitrine
              </Link>

              <h2 className="font-space font-bold text-6xl md:text-8xl uppercase tracking-tighter leading-none mb-2 text-agro-blue">
                <SplitLetterText text={produto.nome} />
              </h2>

              <div className="flex items-center gap-4 mt-2">
                <p className="text-2xl font-bold text-agro-gold uppercase tracking-wider font-poppins">Coleção 2026</p>
                <span className="px-3 py-1 bg-agro-blue text-agro-card text-xs font-bold uppercase rounded-full">Drop Exclusivo</span>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="pl-4 border-l-4 border-agro-gold">
              <p className="text-lg font-poppins text-agro-blue opacity-80 leading-relaxed">
                {produto.descricao}
              </p>
            </motion.div>

            {produto.cores && (
              <motion.div variants={fadeUp} className="font-poppins">
                <p className="font-bold text-sm tracking-widest mb-3 uppercase text-agro-blue opacity-80">
                  Variação: <span className="text-agro-gold opacity-100">{selectedColor}</span>
                </p>
                <div className="flex flex-wrap gap-4">
                  {produto.cores.map((cor: string) => (
                    <button
                      key={cor}
                      onClick={() => setSelectedColor(cor)}
                      className={`px-8 py-3 rounded-2xl font-bold uppercase transition-all duration-300 border-2 ${
                        selectedColor === cor
                          ? 'bg-agro-blue text-agro-card border-agro-blue scale-105 shadow-lg shadow-agro-blue/20'
                          : 'bg-transparent text-agro-blue border-agro-blue/20 hover:border-agro-gold'
                      }`}
                    >
                      {cor}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div variants={fadeUp}>
              <motion.button
                onClick={handleAddToCart}
                disabled={isAdding}
                whileHover={!isAdding ? { scale: 1.02, boxShadow: '0 20px 40px -10px rgba(176,142,104,0.5)' } : {}}
                whileTap={!isAdding ? { scale: 0.98 } : {}}
                className={`font-space font-bold mt-4 py-6 px-8 text-3xl md:text-4xl uppercase rounded-[2rem] transition-all duration-500 w-full text-center tracking-wider overflow-hidden relative group ${
                  isAdding 
                    ? 'bg-agro-blue text-white cursor-default' 
                    : 'bg-agro-gold text-white hover:bg-agro-blue hover:text-agro-card'
                }`}
              >
                <AnimatePresence mode="wait">
                  {isAdding ? (
                    <motion.span 
                      key="added"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      className="relative z-10 flex items-center justify-center gap-3"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Adicionado
                    </motion.span>
                  ) : (
                    <motion.span 
                      key="add"
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 20, opacity: 0 }}
                      className="relative z-10 transition-colors"
                    >
                      Garantir no Carrinho
                    </motion.span>
                  )}
                </AnimatePresence>
                
                {!isAdding && (
                  <div className="absolute inset-0 bg-agro-blue translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out" />
                )}
              </motion.button>
            </motion.div>
          </motion.div>
        </div>

        {/* ═══ GALERIA DINÂMICA ═══ */}
        {currentGallery.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1 }}
            className="mt-32 pt-20 border-t border-agro-blue/20"
          >
            <div className="flex flex-col items-center mb-16 text-center">
              <h3 className="font-space font-bold text-4xl md:text-6xl uppercase tracking-tighter text-agro-blue">
                <SplitLetterText text="SÍNTESE " />
                <SplitLetterText text="DETALHADA" className="text-agro-gold" />
              </h3>
              <p className="font-poppins text-sm uppercase tracking-[0.3em] mt-4 opacity-60 text-agro-blue">
                Análise técnica: <span className="text-agro-gold">{selectedColor}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
              {currentGallery.map((img: string, index: number) => (
                <motion.div
                  key={`${selectedColor}-${index}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.03, y: -10 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="aspect-[4/5] rounded-3xl bg-agro-card border border-transparent hover:border-agro-gold overflow-hidden relative shadow-lg cursor-pointer group"
                >
                  <img
                    src={img}
                    alt={`Render ${index + 1} - ${produto.nome}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-agro-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                    <span className="text-white font-space font-bold uppercase tracking-widest text-xs">
                      Mecanismo 0{index + 1}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}