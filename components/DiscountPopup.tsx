'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function DiscountPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    // 1. Verifica se o usuário já optou por esconder o popup anteriormente
    const isHidden = localStorage.getItem('hideAgroDiscount');
    
    if (!isHidden) {
      const timer = setTimeout(() => setIsOpen(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    // 2. Se a opção estiver marcada, salva no navegador para sempre
    if (dontShowAgain) {
      localStorage.setItem('hideAgroDiscount', 'true');
    }
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center px-4 pointer-events-none">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-agro-black/60 backdrop-blur-sm pointer-events-auto"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-agro-card border-2 border-agro-gold rounded-[2rem] p-10 shadow-[0_0_50px_rgba(176,142,104,0.3)] pointer-events-auto"
          >
            {/* Botão Fechar */}
            <button 
              onClick={handleClose}
              className="absolute top-6 right-6 text-agro-blue/50 hover:text-agro-gold transition-colors text-2xl cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center">
              <h4 className="font-poppins font-bold text-agro-gold uppercase tracking-[0.3em] text-sm mb-4">
                Oferta Especial
              </h4>
              <h2 className="font-space font-bold text-5xl md:text-6xl text-agro-blue uppercase leading-none mb-6">
                Dia das Mães <br/> 
                <span className="text-agro-gold">40% OFF</span>
              </h2>
              <p className="font-poppins text-agro-blue/70 mb-4 text-lg leading-snug">
                Homenageie quem cultiva o futuro. Use o cupom: <br/>
                <span className="font-bold text-agro-blue">MAETOXICA40</span>
              </p>

              {/* Opção: Não mostrar novamente */}
              <div className="flex items-center justify-center gap-3 mb-8 group cursor-pointer" onClick={() => setDontShowAgain(!dontShowAgain)}>
                <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${dontShowAgain ? 'bg-agro-gold border-agro-gold' : 'border-agro-blue/20'}`}>
                  {dontShowAgain && <span className="text-white text-[10px]">✓</span>}
                </div>
                <span className="font-poppins text-xs uppercase tracking-widest text-agro-blue/40 group-hover:text-agro-blue/60 transition-colors">
                  Não mostrar novamente
                </span>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClose}
                className="w-full py-5 bg-agro-blue text-agro-card font-space font-bold text-2xl uppercase rounded-xl shadow-xl hover:opacity-90 transition-all cursor-pointer"
              >
                Garantir Desconto
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}