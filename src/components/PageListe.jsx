import { useState } from 'react'
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

const SORTS = [
  { key: 'pos',     label: 'Position' },
  { key: 'comment', label: 'Commentaire' },
  { key: 'size',    label: 'Taille' },
  { key: 'health',  label: 'Santé' },
]

export default function PageListe({ trees, active, onGotoTree }) {
  const [sort, setSort] = useState('pos')

  const avg      = trees.filter(t => t.hauteur).reduce((s, t, _, a) => s + parseFloat(t.hauteur) / a.length, 0)
  const withNotes = trees.filter(t => t.notes).length

  const sorted = [...trees].sort((a, b) => {
    if (sort === 'comment') {
      const ha = a.notes ? 1 : 0, hb = b.notes ? 1 : 0
      if (ha !== hb) return hb - ha
      return (a._label || '').localeCompare(b._label || '')
    }
    if (sort === 'size')   return (parseFloat(b.hauteur) || 0) - (parseFloat(a.hauteur) || 0)
    if (sort === 'health') return (HEALTH_ORDER[b.sante] ?? -1) - (HEALTH_ORDER[a.sante] ?? -1)
    // pos
    if (a.row != null && b.row != null) { if (a.row !== b.row) return a.row - b.row; return a.col - b.col }
    if (a.row != null) return -1; if (b.row != null) return 1
    return (a._n || 0) - (b._n || 0)
  })

  return (
    <div id="page-list" className={`page page-list${active ? ' active' : ''}`}>
      <div className="sort-bar">
        <span className="sort-lbl">Trier :</span>
        {SORTS.map(s => (
          <button key={s.key} className={`sort-btn${sort === s.key ? ' active' : ''}`} onClick={() => setSort(s.key)}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="lscroll">
        {trees.length === 0 ? (
          <div className="empty">
            <div className="ei">🌱</div>
            <p>Aucun arbre.<br />Allez sur <strong>Champ</strong> pour commencer.</p>
          </div>
        ) : (
          <>
            <div className="srow">
              <div className="sc"><div className="sn">{trees.length}</div><div className="sl">Arbres</div></div>
              <div className="sc"><div className="sn">{withNotes}</div><div className="sl">Avec notes</div></div>
              <div className="sc"><div className="sn">{avg ? Math.round(avg) + 'cm' : '—'}</div><div className="sl">Haut. moy.</div></div>
            </div>
            {sorted.map(t => {
              const h = HEALTH_DEFS.find(x => x.key === t.sante) || { crown: '#4a8a20', trunk: '#2d5a10', emoji: '', label: '' }
              const g = GRASS_DEFS.find(x => x.key === t.grass)  || { label: '—' }
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
