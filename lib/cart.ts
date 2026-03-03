// ─────────────────────────────────────────────────────────────────────────────
// lib/cart.ts
// Salva em: app/../lib/cart.ts  OU  lib/cart.ts (raiz do projeto)
// ─────────────────────────────────────────────────────────────────────────────
// USAGE em qualquer componente:
//   import { cartStore, useCart } from '@/lib/cart'
//   const { items, addItem, removeItem, updateQty, clearCart } = useCart()
// ─────────────────────────────────────────────────────────────────────────────

export type CartItem = {
  id:       string | number;
  nome:     string;
  price:    string;           // ex: "R$ 129,90" — string original do produto
  priceNum: number;           // valor numérico para cálculo
  image:    string;
  color?:   string;
  size?:    string;
  qty:      number;
};

const KEY = 'agro-cart';
const EV  = 'agro-cart-update';

// ── helpers ─────────────────────────────────────────────────────────────────

function parsePrice(price: string): number {
  // "R$ 129,90" → 129.90
  return parseFloat(price.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
}

function read(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

function write(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EV));
}

// ── cartStore (imperativo, sem React) ────────────────────────────────────────

export const cartStore = {
  getItems: read,

  addItem(item: Omit<CartItem, 'qty' | 'priceNum'> & { qty?: number }) {
    const items = read();
    const key   = `${item.id}-${item.color ?? ''}-${item.size ?? ''}`;
    const idx   = items.findIndex(i => `${i.id}-${i.color ?? ''}-${i.size ?? ''}` === key);
    if (idx >= 0) {
      items[idx].qty += item.qty ?? 1;
    } else {
      items.push({ ...item, qty: item.qty ?? 1, priceNum: parsePrice(item.price) });
    }
    write(items);
  },

  removeItem(id: string | number, color?: string, size?: string) {
    const key = `${id}-${color ?? ''}-${size ?? ''}`;
    write(read().filter(i => `${i.id}-${i.color ?? ''}-${i.size ?? ''}` !== key));
  },

  updateQty(id: string | number, qty: number, color?: string, size?: string) {
    const key = `${id}-${color ?? ''}-${size ?? ''}`;
    if (qty <= 0) { this.removeItem(id, color, size); return; }
    write(read().map(i => `${i.id}-${i.color ?? ''}-${i.size ?? ''}` === key ? { ...i, qty } : i));
  },

  clearCart() { write([]); },

  getTotal() {
    return read().reduce((acc, i) => acc + i.priceNum * i.qty, 0);
  },

  getCount() {
    return read().reduce((acc, i) => acc + i.qty, 0);
  },
};

// ── React hook ────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  const sync = useCallback(() => setItems(read()), []);

  useEffect(() => {
    sync();
    window.addEventListener(EV, sync);
    return () => window.removeEventListener(EV, sync);
  }, [sync]);

  const addItem    = useCallback((item: Parameters<typeof cartStore.addItem>[0]) => { cartStore.addItem(item);    }, []);
  const removeItem = useCallback((...a: Parameters<typeof cartStore.removeItem>)  => { cartStore.removeItem(...a); }, []);
  const updateQty  = useCallback((...a: Parameters<typeof cartStore.updateQty>)   => { cartStore.updateQty(...a);  }, []);
  const clearCart  = useCallback(() => { cartStore.clearCart(); }, []);

  const total = items.reduce((acc, i) => acc + i.priceNum * i.qty, 0);
  const count = items.reduce((acc, i) => acc + i.qty, 0);

  return { items, total, count, addItem, removeItem, updateQty, clearCart };
}