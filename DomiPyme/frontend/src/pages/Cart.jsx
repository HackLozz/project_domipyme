// Cart.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * Componente Cart con:
 * - Imágenes por producto (item.image)
 * - Animación al agregar (fade + slide up)
 * - Animación al eliminar (fade out + slide down)
 * - Sincronización con localStorage (dp_cart)
 *
 * Para que la animación de "nuevo" funcione correctamente, cuando agregues
 * productos desde otro componente asegúrate de reescribir localStorage y navegar
 * o disparar un re-render. Este componente detecta nuevas entradas por uid local.
 */

const ANIM_DURATION = 300; // ms (coincide con CSS)

export default function Cart() {
  const [items, setItems] = useState([]);
  const prevIdsRef = useRef(new Set());

  // Genera uid local para gestión de animaciones (no se guarda en backend necesariamente)
  const makeUid = (base = '') => `${Date.now()}_${Math.random().toString(36).slice(2, 9)}${base}`;

  // Carga inicial y asigna uid si no lo tiene, y marca "added" si es nuevo respecto a prevIdsRef
  useEffect(() => {
    const storedRaw = localStorage.getItem('dp_cart') || '[]';
    let stored;
    try {
      stored = JSON.parse(storedRaw);
      if (!Array.isArray(stored)) stored = [];
    } catch {
      stored = [];
    }

    // Mapear y preservar propiedades internas de animación
    const mapped = stored.map((it, idx) => ({
      uid: it.uid || makeUid(idx),
      name: it.name,
      price: it.price,
      qty: it.qty || 1,
      image: it.image || null,
      removing: false,
      added: !prevIdsRef.current.has(it.uid) && true, // si no existía antes, marcar como added
      raw: it, // conservar por si necesita enviarse al backend
    }));

    // actualizar registro previo de ids
    prevIdsRef.current = new Set(mapped.map((m) => m.uid));

    setItems(mapped);

    // limpiar 'added' después de la animación
    const t = setTimeout(() => {
      setItems((prev) => prev.map((p) => ({ ...p, added: false })));
    }, ANIM_DURATION + 40);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // cargar solo una vez al montar

  // Guarda en localStorage los items sin las flags internas
  const persist = (arr) => {
    const toStore = arr.map(({ uid, removing, added, raw, ...rest }) => {
      // mantener imagen/qty/price/name
      return { ...rest };
    });
    localStorage.setItem('dp_cart', JSON.stringify(toStore));
  };

  // Sincroniza estado + localStorage
  const syncCart = (updatedItems) => {
    setItems(updatedItems);
    persist(updatedItems);
    prevIdsRef.current = new Set(updatedItems.map((i) => i.uid));
  };

  // Aumentar cantidad
  const increaseQty = (uid) => {
    const updated = items.map((it) =>
      it.uid === uid ? { ...it, qty: (it.qty || 1) + 1 } : it
    );
    syncCart(updated);
  };

  // Disminuir cantidad (no baja de 1)
  const decreaseQty = (uid) => {
    const updated = items.map((it) =>
      it.uid === uid ? { ...it, qty: Math.max(1, (it.qty || 1) - 1) } : it
    );
    syncCart(updated);
  };

  // Señalar eliminación y eliminar tras la animación
  const removeItem = (uid) => {
    // marcar como removing
    setItems((prev) => prev.map((it) => (it.uid === uid ? { ...it, removing: true } : it)));

    // esperar animación y luego quitar
    setTimeout(() => {
      setItems((prev) => {
        const filtered = prev.filter((it) => it.uid !== uid);
        persist(filtered);
        prevIdsRef.current = new Set(filtered.map((i) => i.uid));
        return filtered;
      });
    }, ANIM_DURATION);
  };

  // Añadir item de ejemplo (útil para probar la animación "added")
  // Nota: en producción agregarás desde otro componente / API que escriba a localStorage
  const addItemTest = () => {
    const sample = {
      uid: makeUid('test'),
      name: 'Producto de prueba ' + Math.floor(Math.random() * 100),
      price: (Math.floor(Math.random() * 20000) + 1000).toString(),
      qty: 1,
      image: null,
      removing: false,
      added: true,
    };
    const updated = [sample, ...items];
    syncCart(updated);
    // quitar la bandera 'added' después de la animación para que no quede marcada
    setTimeout(() => {
      setItems((prev) => prev.map((p) => (p.uid === sample.uid ? { ...p, added: false } : p)));
    }, ANIM_DURATION + 40);
  };

  const total = items.reduce((sum, it) => sum + Number(it.price) * (it.qty || 1), 0);

  // placeholder image (base64 small or link)
  const placeholder = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'>
      <rect width='100%' height='100%' fill='#e5e7eb'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#9ca3af' font-size='20'>No Image</text>
    </svg>`
  );

  return (
    <div style={styles.container}>
      {/* CSS para animaciones */}
      <style>{`
        .cart-item {
          transition: transform ${ANIM_DURATION}ms ease, opacity ${ANIM_DURATION}ms ease, height ${ANIM_DURATION}ms ease, margin ${ANIM_DURATION}ms ease, padding ${ANIM_DURATION}ms ease;
          transform-origin: center;
          opacity: 1;
        }
        .cart-item.added {
          animation: enterAnim ${ANIM_DURATION}ms ease both;
        }
        .cart-item.removing {
          animation: exitAnim ${ANIM_DURATION}ms ease both;
        }
        @keyframes enterAnim {
          0% { opacity: 0; transform: translateY(10px) scale(0.995); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes exitAnim {
          0% { opacity: 1; transform: translateY(0) scale(1); height: auto; }
          100% { opacity: 0; transform: translateY(8px) scale(0.995); height: 0; margin: 0; padding: 0; }
        }
      `}</style>

      <h2 style={styles.title}>Carrito de compras</h2>

      <div style={styles.controlsRow}>
        <button style={styles.testBtn} onClick={addItemTest}>+ Añadir item de prueba</button>
        <Link to="/catalog" style={styles.linkBtn}>Seguir comprando</Link>
      </div>

      {items.length === 0 ? (
        <p style={styles.empty}>Tu carrito está vacío 💙</p>
      ) : (
        <>
          <ul style={styles.list}>
            {items.map((item) => {
              const classes = ['cart-item'];
              if (item.added) classes.push('added');
              if (item.removing) classes.push('removing');
              return (
                <li key={item.uid} className={classes.join(' ')} style={styles.item}>
                  <div style={styles.left}>
                    <img
                      src={item.image || placeholder}
                      alt={item.name}
                      style={styles.thumb}
                    />
                    <div style={styles.meta}>
                      <strong style={{display:'block'}}>{item.name}</strong>
                      <div style={styles.price}>{Number(item.price).toLocaleString()} COP</div>
                    </div>
                  </div>

                  <div style={styles.right}>
                    <div style={styles.qtyWrap}>
                      <button onClick={() => decreaseQty(item.uid)} style={styles.qtyBtn}>-</button>
                      <span style={styles.qty}>{item.qty || 1}</span>
                      <button onClick={() => increaseQty(item.uid)} style={styles.qtyBtn}>+</button>
                    </div>

                    <div style={styles.itemActions}>
                      <button onClick={() => removeItem(item.uid)} title="Eliminar" style={styles.removeBtn}>Eliminar</button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div style={styles.totalRow}>
            <div>Total:</div>
            <div style={styles.totalAmount}>{total.toLocaleString()} COP</div>
          </div>

          <div style={styles.footer}>
            <Link to="/checkout" style={styles.checkoutBtn}>Ir a pagar</Link>
          </div>
        </>
      )}
    </div>
  );
}

/* --- Estilos inline --- */
const styles = {
  container: { padding: 20, maxWidth: 860, margin: '0 auto', fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial' },
  title: { fontSize: 24, marginBottom: 10 },
  controlsRow: { display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' },
  testBtn: { padding: '8px 10px', borderRadius: 8, background: '#111827', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 },
  linkBtn: { padding: '8px 10px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(0,0,0,0.08)', textDecoration: 'none', color: '#111827' },
  empty: { color: '#6b7280', fontSize: 16 },
  list: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    background: '#f9fafb',
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
    minHeight: 76,
  },
  left: { display: 'flex', alignItems: 'center', gap: 12 },
  thumb: { width: 96, height: 64, objectFit: 'cover', borderRadius: 8, background: '#e5e7eb' },
  meta: { display: 'flex', flexDirection: 'column', gap: 4 },
  price: { color: '#374151', fontWeight: 600 },
  right: { display: 'flex', alignItems: 'center', gap: 16 },
  qtyWrap: { display: 'flex', alignItems: 'center', gap: 8, background: 'white', padding: '6px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.06)' },
  qtyBtn: { background: 'transparent', border: 'none', padding: '6px 8px', cursor: 'pointer', fontWeight: 700 },
  qty: { minWidth: 28, textAlign: 'center', fontWeight: 700 },
  itemActions: { display: 'flex', flexDirection: 'column', gap: 6 },
  removeBtn: { background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px 8px' },
  totalRow: { display: 'flex', justifyContent: 'space-between', marginTop: 18, padding: '12px 14px', background: '#fff', borderRadius: 8, alignItems: 'center', border: '1px solid rgba(0,0,0,0.04)' },
  totalAmount: { fontSize: 18, fontWeight: 800 },
  footer: { marginTop: 14, display: 'flex', justifyContent: 'flex-end' },
  checkoutBtn: { padding: '10px 16px', background: '#111827', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 700 },
};
