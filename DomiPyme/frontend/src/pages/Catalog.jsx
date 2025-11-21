// Catalog.jsx
import React, { useEffect, useState, useRef } from 'react';
import api from '../components/Api';
import { Link } from 'react-router-dom';

const ANIM_DURATION = 360; // ms
const STAGGER = 80; // ms between items

export default function Catalog() {
  const [shops, setShops] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Para manejar animaciones de entrada detectando ids previos
  const prevIdsRef = useRef(new Set());

  const makeUid = (s, idx) => {
    // crear uid estable (intenta usar slug/id si existe)
    const base = s?.slug ?? s?.id ?? idx;
    return `${base}_${String(s?.updated_at ?? s?.created_at ?? '').slice(0,10)}_${idx}`;
  };

  const loadShops = async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('shops/', { signal });
      const data = Array.isArray(res.data) ? res.data : [];
      // mapear shops y añadir uid + flags de animación
      const mapped = data.map((s, idx) => {
        const uid = makeUid(s, idx);
        return {
          ...s,
          uid,
          added: !prevIdsRef.current.has(uid),
          removing: false,
        };
      });

      prevIdsRef.current = new Set(mapped.map((m) => m.uid));
      setShops(mapped);
      setFiltered(mapped);

      // quitar bandera 'added' tras animación para que no vuelva a animarse
      setTimeout(() => {
        setShops((prev) => prev.map((p) => ({ ...p, added: false })));
        setFiltered((prev) => prev.map((p) => ({ ...p, added: false })));
      }, ANIM_DURATION + STAGGER * 4);
    } catch (e) {
      if (e.name === 'CanceledError' || e.name === 'AbortError') return;
      console.error(e);
      setError('No se pudo cargar el catálogo. Intenta recargar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadShops(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const term = q.trim().toLowerCase();
    if (!term) {
      setFiltered(shops);
      return;
    }
    setFiltered(
      shops.filter((s) =>
        (s.name || '').toLowerCase().includes(term) ||
        (s.description || '').toLowerCase().includes(term)
      )
    );
  }, [q, shops]);

  const handleReload = () => {
    const controller = new AbortController();
    loadShops(controller.signal);
  };

  // placeholder image (inline svg)
  const placeholder = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'>
      <rect width='100%' height='100%' fill='#f3f4f6'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#9ca3af' font-size='22'>Imagen no disponible</text>
    </svg>`
  );

  return (
    <div style={styles.container}>
      {/* estilos CSS para animaciones y skeletons */}
      <style>{`
        .catalog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; list-style: none; padding: 0; margin: 0; }
        .catalog-card {
          background: white;
          border-radius: 10px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          overflow: hidden;
          border: 1px solid #eef2f7;
          transform-origin: center;
          transition: transform ${ANIM_DURATION}ms cubic-bezier(.2,.9,.2,1), box-shadow ${ANIM_DURATION}ms ease;
        }
        .catalog-card:hover { transform: translateY(-6px) scale(1.01); box-shadow: 0 8px 20px rgba(3,7,18,0.08); }
        .catalog-card .imageWrap { width:100%; height:140px; overflow:hidden; background:#f6f7f9; display:block; }
        .catalog-card img { width:100%; height:100%; object-fit:cover; display:block; transition: transform 450ms ease; }
        .catalog-card:hover img { transform: scale(1.03); }

        /* entry animation */
        .catalog-item { opacity: 0; transform: translateY(10px) scale(0.995); }
        .catalog-item.enter { animation: enterAnim ${ANIM_DURATION}ms ease forwards; }
        @keyframes enterAnim {
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* simple fade for removal if needed */
        .catalog-item.exit { animation: exitAnim ${ANIM_DURATION}ms ease forwards; }
        @keyframes exitAnim {
          to { opacity: 0; transform: translateY(8px) scale(0.995); height:0; margin:0; padding:0; }
        }

        /* skeleton */
        .skeleton {
          background: linear-gradient(90deg, #f3f4f6 0%, #efefef 50%, #f3f4f6 100%);
          background-size: 200% 100%;
          animation: shimmer 1200ms linear infinite;
        }
        @keyframes shimmer {
          from { background-position: 200% 0; }
          to { background-position: -200% 0; }
        }
      `}</style>

      <header style={styles.header}>
        <h2 style={styles.title}>Catálogo de Comercios</h2>

        <div style={styles.controls}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o descripción..."
            style={styles.search}
            aria-label="Buscar comercios"
          />
          <button onClick={handleReload} style={styles.reloadBtn}>Recargar</button>
        </div>
      </header>

      {loading && (
        // skeleton grid
        <ul className="catalog-grid" style={{ marginTop: 8 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #eef2f7', background:'#fff' }}>
              <div style={{ height: 140 }} className="skeleton" />
              <div style={{ padding: 12 }}>
                <div className="skeleton" style={{ height: 16, width: '60%', borderRadius: 6, marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 12, width: '90%', borderRadius: 6, marginBottom: 6 }} />
                <div className="skeleton" style={{ height: 12, width: '80%', borderRadius: 6, marginTop: 8 }} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && error && <p style={{ ...styles.message, color: '#ff6b6b' }}>{error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <p style={styles.message}>No se encontraron comercios.</p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <ul className="catalog-grid" style={{ marginTop: 8 }}>
          {filtered.map((s, idx) => {
            const slugOrId = s.slug || s.id;
            const shopUrl = `/shop/${slugOrId}`;
            const delay = idx * STAGGER;
            const classes = ['catalog-item'];
            if (s.added) classes.push('enter');

            return (
              <li
                key={s.uid ?? slugOrId}
                className={classes.join(' ')}
                style={{
                  // animar con stagger usando animationDelay
                  animationDelay: s.added ? `${delay}ms` : '0ms',
                }}
              >
                <Link to={shopUrl} style={styles.cardLink}>
                  <article className="catalog-card" style={styles.card}>
                    <div className="imageWrap" style={styles.imageWrap}>
                      <img
                        src={s.image || s.logo || placeholder}
                        alt={s.name || 'Tienda'}
                        style={styles.image}
                        onError={(e) => (e.currentTarget.src = placeholder)}
                      />
                    </div>

                    <div style={styles.cardBody}>
                      <h3 style={styles.shopName}>{s.name || 'Nombre no disponible'}</h3>
                      {s.description ? (
                        <p style={styles.desc}>{s.description}</p>
                      ) : (
                        <p style={{ ...styles.desc, color: '#9ca3af' }}>Sin descripción</p>
                      )}

                      <div style={styles.meta}>
                        {s.city && <span style={styles.metaItem}>{s.city}</span>}
                        {s.category && <span style={styles.metaItem}>{s.category}</span>}
                      </div>
                    </div>
                  </article>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const styles = {
  container: { padding: 20, maxWidth: 1100, margin: '0 auto', fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16 },
  title: { margin: 0 },
  controls: { display: 'flex', gap: 8, alignItems: 'center' },
  search: {
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid #ddd',
    minWidth: 240
  },
  reloadBtn: {
    padding: '8px 12px',
    borderRadius: 8,
    border: 'none',
    background: '#111827',
    color: 'white',
    cursor: 'pointer'
  },
  message: { textAlign: 'center', marginTop: 12 },
  card: { display: 'block', height: '100%' },
  cardLink: { color: 'inherit', textDecoration: 'none', display: 'block', height: '100%' },
  imageWrap: { width: '100%', height: 140, overflow: 'hidden', background: '#f6f7f9' },
  image: { width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 450ms ease' },
  cardBody: { padding: 12 },
  shopName: { margin: '0 0 6px 0', fontSize: 16 },
  desc: { margin: 0, fontSize: 13, color: '#4b5563', minHeight: 36 },
  meta: { marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' },
  metaItem: {
    background: '#f1f5f9',
    padding: '4px 8px',
    borderRadius: 999,
    fontSize: 12,
    color: '#334155'
  }
};
