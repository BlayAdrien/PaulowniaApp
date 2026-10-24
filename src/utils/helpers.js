export const uid   = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
export const today = () => new Date().toISOString().slice(0, 10)
export const fmt   = d  => d
  ? new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  : ''

export function heightLabel(h) {
  const v = parseFloat(h) || 0
  if (!v)       return 'Taille inconnue'
  if (v <= 20)  return 'Très petit'
  if (v <= 50)  return 'Petit'
  if (v <= 100) return 'Moyen'
  if (v <= 150) return 'Mi-grand'
  if (v <= 200) return 'Grand'
  if (v <= 300) return 'Très grand'
  if (v <= 500) return 'Imposant'
  if (v <= 1000)return 'Géant'
  if (v <= 1500)return 'Très grand arbre'
  return 'Exceptionnel'
}

export function isoWeek(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T12:00:00')
  const tmp = new Date(d); tmp.setHours(0, 0, 0, 0)
  tmp.setDate(tmp.getDate() + 3 - (tmp.getDay() || 7) - 1)
  const week1 = new Date(tmp.getFullYear(), 0, 4)
  const wn = 1 + Math.round(((tmp - week1) / 86400000 - 3 + (week1.getDay() || 7)) / 7)
  return `${tmp.getFullYear()}-W${String(wn).padStart(2, '0')}`
}

export function weekMonday(key) {
  const [y, w] = key.split('-W')
  const d = new Date(+y, 0, 1 + ((+w - 1) * 7))
  d.setDate(d.getDate() - (d.getDay() || 7) + 1)
  return d
}

export function renumber(trees) {
  // Grille : L1C1
  trees.forEach(t => {
    if (t.row != null && t.col != null) t._label = `L${t.row + 1}C${t.col + 1}`
  })
  // Libres : #n par colonne
  const free = trees.filter(t => t.row == null)
  if (free.length) {
    const sorted = [...free].sort((a, b) => a.xm !== b.xm ? a.xm - b.xm : a.ym - b.ym)
    const cols = []
    sorted.forEach(t => {
      const last = cols[cols.length - 1]
      if (!last || Math.abs(t.xm - last[0].xm) > 1.0) cols.push([t])
      else last.push(t)
    })
    cols.forEach(col => {
      col.sort((a, b) => a.ym - b.ym).forEach((t, i) => {
        const real = trees.find(x => x.id === t.id)
        if (real) { real._n = i + 1; real._label = `#${i + 1}` }
      })
    })
  }
  return trees
}

/* ══ Grille : chaque case Lx Cy correspond à une position fixe ══════════════
   x = x0 + colonne × espacementX     y = y0 + ligne × espacementY        */

/* Valeur la plus fréquente (arrondie au dixième) ; à égalité, la plus petite */
function mode(vals) {
  const cnt = {}
  vals.forEach(v => { const k = Math.round(v * 10) / 10; cnt[k] = (cnt[k] || 0) + 1 })
  return Object.entries(cnt).map(([k, n]) => [+k, n]).sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0] ?? null
}

function axisLattice(values, fallback) {
  const u = [...new Set(values.map(v => Math.round(v * 10) / 10))].sort((a, b) => a - b)
  const gaps = []
  for (let i = 1; i < u.length; i++) if (u[i] - u[i - 1] > 0.5) gaps.push(u[i] - u[i - 1])
  const step = mode(gaps) || fallback
  let origin = mode(values.map(v => ((v % step) + step) % step)) ?? 0
  if (step - origin < 0.15) origin = 0
  return { step, origin }
}

/* Déduit la grille (espacement + origine) à partir des positions des arbres */
export function getLattice(trees, fallback = 5) {
  const x = axisLattice(trees.map(t => t.xm), fallback)
  const y = axisLattice(trees.map(t => t.ym), fallback)
  return { sx: x.step, x0: x.origin, sy: y.step, y0: y.origin }
}

export function cellPos(lat, row, col) {
  return { xm: +(lat.x0 + col * lat.sx).toFixed(3), ym: +(lat.y0 + row * lat.sy).toFixed(3) }
}

export const cellLabel = (row, col) => `L${row + 1}C${col + 1}`

/* "L19C9", "l19 c9", "19-9"… → { row: 18, col: 8 } */
export function parseCell(str) {
  const m = String(str || '').trim().match(/^l?\s*(\d+)\s*[c\-\s,;/]\s*(\d+)$/i)
  if (!m) return null
  const row = +m[1] - 1, col = +m[2] - 1
  return row >= 0 && col >= 0 ? { row, col } : null
}

export const treeName = t => t.name || t._label || 'Arbre'

/* Recalcule la case de chaque arbre à partir de sa position (sans rien modifier) */
export function planRenumber(trees, tol = 0.3) {
  const lat = getLattice(trees)
  const best = new Map()   // case → { t, err, row, col }
  const skipped = []
  trees.forEach(t => {
    const c = (t.xm - lat.x0) / lat.sx, r = (t.ym - lat.y0) / lat.sy
    const col = Math.round(c), row = Math.round(r)
    const err = Math.max(Math.abs(c - col), Math.abs(r - row))
    if (err > tol)          return skipped.push({ tree: t, reason: 'entre deux cases' })
    if (row < 0 || col < 0) return skipped.push({ tree: t, reason: 'hors de la grille' })
    const k = `${row}:${col}`, cur = best.get(k)
    const cand = { t, err, row, col }
    if (!cur) best.set(k, cand)
    else if (err < cur.err) { skipped.push({ tree: cur.t, reason: `même case que ${treeName(t)} (${cellLabel(row, col)})` }); best.set(k, cand) }
    else skipped.push({ tree: t, reason: `même case que ${treeName(cur.t)} (${cellLabel(row, col)})` })
  })
  const assign = [], changes = []
  best.forEach(({ t, row, col }) => {
    const pos = cellPos(lat, row, col)
    const relabel = t.row !== row || t.col !== col
    if (relabel || Math.abs(t.xm - pos.xm) > 0.001 || Math.abs(t.ym - pos.ym) > 0.001) {
      assign.push({ id: t.id, row, col, ...pos })
      if (relabel) changes.push({ tree: t, from: t._label || '?', to: cellLabel(row, col) })
    }
  })
  return { lat, assign, changes, skipped }
}
