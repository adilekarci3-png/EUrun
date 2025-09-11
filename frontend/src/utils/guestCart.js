export const GUEST_CART_KEY = "guest_cart_v1";

export function readGuestCart() {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    // aynı product_id birden fazla ise miktarları topla
    const map = new Map();
    for (const it of arr) {
      if (!it || !it.product_id) continue;
      const pid = Number(it.product_id);
      const qty = Number(it.quantity || 1);
      const prev = map.get(pid);
      if (prev) {
        map.set(pid, {
          ...prev,
          quantity: prev.quantity + qty,
        });
      } else {
        map.set(pid, {
          product_id: pid,
          quantity: qty,
          product: it.product || null,
        });
      }
    }
    return [...map.values()];
  } catch {
    return [];
  }
}

export function clearGuestCart() {
  try { localStorage.removeItem(GUEST_CART_KEY); } catch {}
}
