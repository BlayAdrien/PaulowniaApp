import { useState, useMemo } from 'react'
import { HEALTH_DEFS, GRASS_DEFS, HEALTH_ORDER } from '../utils/constants'
import { fmt, heightLabel } from '../utils/helpers'

function TreeSVG({ r, crown, trunk }) {
  const s = r * 2.6, tw = Math.max(2, r * .22), th = r * .55, crx = r, cry = r * .82, cY = r * .82 * .6
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: 'block', flexShrink: 0 }}>
      <rect x={s/2-tw/2} y={s/2} width={tw} height={th} rx={tw/3} fill={trunk} opacity=".9" />
      <ellipse cx={s/2} cy={s/2-cY} rx={crx} ry={cry} fill={crown} opacity=".93" />
      <ellipse cx={s/2-crx*.25} cy={s/2-cY-cry*.25} rx={crx*.3} ry={cry*.22} fill="rgba(255,255,255,.22)" />
    </svg>
  )
}

const HEALTH_COLORS = {
  mort:  '#111',
  tbad:  '#5c2a0a',
  bad:   '#8b4513',
  bon:   '#4a8a20',
  excel: '#22a03a',
}

// Tranches de taille prédéfinies
const SIZE_RANGES = [
  { label: 'Tous',         min: 0,    max: Infinity },
  { label: '0–20 cm',      min: 0,    max: 20 },
  { label: '20–50 cm',     min: 20,   max: 50 },
  { label: '50–100 cm',    min: 50,   max: 100 },
  { label: '100–150 cm',   min: 100,  max: 150 },
  { label: '150–200 cm',   min: 150,  max: 200 },
  { label: '200–300 cm',   min: 200,  max: 300 },
  { label: '300–500 cm',   min: 300,  max: 500 },
  { label: '500–1000 cm',  min: 500,  max: 1000 },
  { label: '1000–1500 cm', min: 1000, max: 1500 },
  { label: '1500 cm +',    min: 1500, max: Infinity },
]

export default function PageListe({ trees, active, onGotoTree }) {
  // Sort
  const [sort, setSort]         = useState('pos')
  const [sortDir, setSortDir]   = useState(1) // 1 = croissant, -1 = décroissant

  // Filtres
  const [sizeRange, setSizeRange]     = useState(0)       // index dans SIZE_RANGES
  const [healthFilter, setHealthFilter] = useState('')    // clé santé ou ''
  const [commentOnly, setCommentOnly] = useState(false)

  function toggleSort(key) {
    if (sort === key) setSortDir(d => d * -1)  // même colonne → inverse direction
    else { setSort(key); setSortDir(1) }
  }

  // Compteurs par statut santé (sur tous les arbres, sans filtre)
  const healthCounts = useMemo(() => {
    const c = {}
    HEALTH_DEFS.forEach(h => { c[h.key] = 0 })
    trees.forEach(t => { if (t.sante && c[t.sante] !== undefined) c[t.sante]++ })
    return c
  }, [trees])

  // Compteurs par tranche de taille (sur tous les arbres)
  const sizeCounts = useMemo(() => {
    return SIZE_RANGES.map(r => trees.filter(t => {
      const h = parseFloat(t.hauteur) || 0
      return h >= r.min && h < r.max
    }).length)
  }, [trees])

  // Application des filtres + tri
  const displayed = useMemo(() => {
    let list = [...trees]

    // Filtre commentaire
    if (commentOnly) list = list.filter(t => t.notes && t.notes.trim())

    // Filtre santé
    if (healthFilter) list = list.filter(t => t.sante === healthFilter)

    // Filtre taille
    const range = SIZE_RANGES[sizeRange]
    if (sizeRange !== 0) {
      list = list.filter(t => {
        const h = parseFloat(t.hauteur) || 0
        return h >= range.min && h < range.max
      })
    }

    // Tri
    list.sort((a, b) => {
      let diff = 0
      if (sort === 'comment') {
        const ha = a.notes ? 1 : 0, hb = b.notes ? 1 : 0
        diff = hb - ha
        if (diff === 0) diff = (a._label || '').localeCompare(b._label || '')
      } else if (sort === 'size') {
        diff = (parseFloat(a.hauteur) || 0) - (parseFloat(b.hauteur) || 0)
      } else if (sort === 'health') {
        diff = (HEALTH_ORDER[a.sante] ?? -1) - (HEALTH_ORDER[b.sante] ?? -1)
      } else {
        // pos
        if (a.row != null && b.row != null) {
          diff = a.row !== b.row ? a.row - b.row : a.col - b.col
        } else if (a.row != null) return -1 * sortDir
        else if (b.row != null) return 1 * sortDir
        else diff = (a._n || 0) - (b._n || 0)
      }
      return diff * sortDir
    })

    return list
  }, [trees, sort, sortDir, sizeRange, healthFilter, commentOnly])

  // Stats globales
  const withNotes = trees.filter(t => t.notes && t.notes.trim()).length
  const avgAll    = trees.filter(t => t.hauteur).reduce((s, t, _, a) => s + parseFloat(t.hauteur) / a.length, 0)
  const hasFilter = sizeRange !== 0 || healthFilter !== '' || commentOnly

  const SORT_BTNS = [
    { key: 'pos',     label: 'Position' },
    { key: 'size',    label: 'Taille' },
    { key: 'health',  label: 'Santé' },
    { key: 'comment', label: 'Notes' },
  ]

  return (
    <div id="page-list" className={`page page-list${active ? ' active' : ''}`}>

      {/* ── Barre tri ── */}
      <div className="sort-bar">
        <span className="sort-lbl">Trier :</span>
        {SORT_BTNS.map(s => (
          <button
            key={s.key}
            className={`sort-btn${sort === s.key ? ' active' : ''}`}
            onClick={() => toggleSort(s.key)}
          >
            {s.label}
            {sort === s.key ? (sortDir === 1 ? ' ↑' : ' ↓') : ''}
          </button>
        ))}
      </div>

      {/* ── Filtres ── */}
      <div style={{
        flexShrink: 0, background: 'var(--cream)', borderBottom: '1.5px solid var(--sand)',
        padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {/* Filtre taille */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--barkl)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
            Taille
          </div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {SIZE_RANGES.map((r, i) => (
              <button
                key={i}
                onClick={() => setSizeRange(i)}
                style={{
                  padding: '4px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                  border: '1.5px solid', cursor: 'pointer', whiteSpace: 'nowrap',
                  background: sizeRange === i ? 'var(--moss)' : 'var(--parch)',
                  color: sizeRange === i ? '#fff' : 'var(--bark)',
                  borderColor: sizeRange === i ? 'var(--moss)' : 'var(--sand)',
                }}
              >
                {r.label}
                {i !== 0 && <span style={{ opacity: .65, marginLeft: 4 }}>({sizeCounts[i]})</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Filtre santé */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--barkl)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
            Santé
          </div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            <button
              onClick={() => setHealthFilter('')}
              style={{
                padding: '4px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                border: '1.5px solid', cursor: 'pointer',
                background: healthFilter === '' ? 'var(--moss)' : 'var(--parch)',
                color: healthFilter === '' ? '#fff' : 'var(--bark)',
                borderColor: healthFilter === '' ? 'var(--moss)' : 'var(--sand)',
              }}
            >
              Tous
            </button>
            {HEALTH_DEFS.map(h => (
              <button
                key={h.key}
                onClick={() => setHealthFilter(healthFilter === h.key ? '' : h.key)}
                style={{
                  padding: '4px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                  border: '1.5px solid', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                  background: healthFilter === h.key ? HEALTH_COLORS[h.key] : 'var(--parch)',
                  color: healthFilter === h.key ? '#fff' : 'var(--bark)',
                  borderColor: healthFilter === h.key ? HEALTH_COLORS[h.key] : 'var(--sand)',
                }}
              >
                {h.emoji} {h.label}
                <span style={{ opacity: .7 }}>({healthCounts[h.key]})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filtre commentaire */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setCommentOnly(v => !v)}
            style={{
              padding: '5px 13px', borderRadius: 20, fontSize: 10, fontWeight: 700,
              border: '1.5px solid', cursor: 'pointer',
              background: commentOnly ? '#a06520' : 'var(--parch)',
              color: commentOnly ? '#fff' : 'var(--bark)',
              borderColor: commentOnly ? '#a06520' : 'var(--sand)',
            }}
          >
            💬 Avec notes seulement
          </button>
          <span style={{ fontSize: 10, color: 'var(--barkl)' }}>{withNotes} arbre{withNotes !== 1 ? 's' : ''} avec notes</span>
        </div>
      </div>

      {/* ── Liste ── */}
      <div className="lscroll">
        {trees.length === 0 ? (
          <div className="empty">
            <div className="ei">🌱</div>
            <p>Aucun arbre.<br />Allez sur <strong>Champ</strong> pour commencer.</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="srow">
              <div className="sc">
                <div className="sn">{displayed.length}<span style={{ fontSize: 14 }}>{hasFilter ? `/${trees.length}` : ''}</span></div>
                <div className="sl">{hasFilter ? 'Filtrés' : 'Arbres'}</div>
              </div>
              <div className="sc">
                <div className="sn">{withNotes}</div>
                <div className="sl">Avec notes</div>
              </div>
              <div className="sc">
                <div className="sn">{avgAll ? Math.round(avgAll) + 'cm' : '—'}</div>
                <div className="sl">Haut. moy.</div>
              </div>
            </div>

            {/* Compteurs santé si filtre actif */}
            {!healthFilter && (
              <div style={{
                display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12,
                padding: '10px 2px',
              }}>
                {HEALTH_DEFS.filter(h => healthCounts[h.key] > 0).map(h => (
                  <div
                    key={h.key}
                    onClick={() => setHealthFilter(h.key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer',
                      background: 'var(--cream)', borderRadius: 10, padding: '5px 10px',
                      border: `1.5px solid ${HEALTH_COLORS[h.key]}`,
                      fontSize: 11, fontWeight: 700, color: 'var(--ink)',
                    }}
                  >
                    <div style={{ width: 9, height: 9, borderRadius: '50%', background: HEALTH_COLORS[h.key], flexShrink: 0 }} />
                    {h.label}
                    <span style={{
                      background: HEALTH_COLORS[h.key], color: '#fff',
                      borderRadius: 20, padding: '0 6px', fontSize: 10,
                    }}>{healthCounts[h.key]}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Résultat vide après filtre */}
            {displayed.length === 0 ? (
              <div className="empty">
                <div className="ei">🔍</div>
                <p>Aucun arbre ne correspond<br />aux filtres sélectionnés.</p>
                <button
                  onClick={() => { setSizeRange(0); setHealthFilter(''); setCommentOnly(false) }}
                  style={{ marginTop: 14, padding: '8px 18px', background: 'var(--moss)', color: '#fff', border: 'none', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : displayed.map(t => {
              const h = HEALTH_DEFS.find(x => x.key === t.sante) || { crown: '#4a8a20', trunk: '#2d5a10', emoji: '', label: '' }
              const g = GRASS_DEFS.find(x => x.key === t.grass) || { label: '—' }
              const r = Math.max(10, Math.min(20, 10 + parseFloat(t.hauteur || 0) / 30))
              const dispName = t.name ? `${t.name} (${t._label || ''})` : (t._label || 'Arbre ?')
              return (
                <div key={t.id} className="li" onClick={() => onGotoTree(t.id)}>
                  <TreeSVG r={r} crown={h.crown} trunk={h.trunk} />
                  <div className="linfo">
                    <div className="lname">{dispName}</div>
                    <div className="lmeta">
                      {t.hauteur ? `${heightLabel(t.hauteur)} · ${t.hauteur}cm` : '—'}
                      {h.emoji ? ` · ${h.emoji} ${h.label}` : ''}
                    </div>
                    <div className="lmeta" style={{ marginTop: 1, fontSize: 10, opacity: .7 }}>Herbe : {g.label}</div>
                    {t.notes && <div className="lnote-badge">💬 {t.notes.slice(0, 40)}{t.notes.length > 40 ? '…' : ''}</div>}
                    {t.datePlantation && <div className="lpos">Planté {fmt(t.datePlantation)}</div>}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
