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

const median = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] }

/* Espacement + origine d'un axe, déduits des arbres déjà numérotés.
   On compare les arbres d'une même ligne (ou colonne) : la médiane ignore
   les quelques arbres posés à la main ou mal numérotés. */
function axisLattice(grid, pos, idx, same, fallback) {
  const byLine = {}
  grid.forEach(t => { (byLine[t[same]] = byLine[t[same]] || []).push(t) })
  const steps = []
  Object.values(byLine).forEach(line => {
    for (let i = 0; i < line.length; i++) for (let j = i + 1; j < line.length; j++) {
      const a = line[i], b = line[j]
      if (a[idx] === b[idx]) continue
      const s = (b[pos] - a[pos]) / (b[idx] - a[idx])
      if (s > 0.3) steps.push(s)
    }
  })
  const step = steps.length ? Math.round(median(steps) * 100) / 100 : fallback
  const origin = grid.length ? Math.round(median(grid.map(t => t[pos] - t[idx] * step)) * 100) / 100 : 0
  return { step, origin }
}

/* Déduit la grille (espacement + origine) à partir des arbres déjà numérotés */
export function getLattice(trees, fallback = 5) {
  const grid = trees.filter(t => t.row != null && t.col != null)
  const x = axisLattice(grid, 'xm', 'col', 'row', fallback)
  const y = axisLattice(grid, 'ym', 'row', 'col', fallback)
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

/* Recalcule la case de chaque arbre (sans rien modifier).
   - position nette sur une case  → l'arbre prend cette case
   - position ambiguë (entre deux) → il garde son numéro et se recale dessus
   - deux arbres sur une même case → celui qui avait déjà ce numéro est prioritaire */
export function planRenumber(trees, tol = 0.3) {
  const lat = getLattice(trees)
  const skipped = [], wants = []
  trees.forEach(t => {
    const c = (t.xm - lat.x0) / lat.sx, r = (t.ym - lat.y0) / lat.sy
    const col = Math.round(c), row = Math.round(r)
    const err = Math.max(Math.abs(c - col), Math.abs(r - row))
    const hasLabel = t.row != null && t.col != null
    if (err <= tol && row >= 0 && col >= 0) wants.push({ t, row, col, err, keeps: hasLabel && t.row === row && t.col === col })
    else if (hasLabel) wants.push({ t, row: t.row, col: t.col, err: 1, keeps: true })
    else skipped.push({ tree: t, reason: row < 0 || col < 0 ? 'hors de la grille' : 'entre deux cases' })
  })
  // prioritaires d'abord : ceux qui gardent leur numéro, puis les mieux placés
  wants.sort((a, b) => (b.keeps - a.keeps) || (a.err - b.err))
  const taken = new Map(), assign = [], changes = []
  wants.forEach(w => {
    const k = `${w.row}:${w.col}`
    if (taken.has(k)) return skipped.push({ tree: w.t, reason: `même case que ${treeName(taken.get(k))} (${cellLabel(w.row, w.col)})` })
    taken.set(k, w.t)
    const pos = cellPos(lat, w.row, w.col)
    const relabel = w.t.row !== w.row || w.t.col !== w.col
    if (relabel || Math.abs(w.t.xm - pos.xm) > 0.001 || Math.abs(w.t.ym - pos.ym) > 0.001) {
      assign.push({ id: w.t.id, row: w.row, col: w.col, ...pos })
      if (relabel) changes.push({ tree: w.t, from: w.t._label || '?', to: cellLabel(w.row, w.col) })
    }
  })
  return { lat, assign, changes, skipped }
}
