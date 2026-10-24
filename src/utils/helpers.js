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

const median = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] }

/* Espacement typique entre colonnes (axe x) ou lignes (axe y) parmi des arbres en grille */
function spacing(grid, axis) {
  const pos = axis === 'x' ? 'xm' : 'ym', idx = axis === 'x' ? 'col' : 'row', same = axis === 'x' ? 'row' : 'col'
  const steps = []
  for (let i = 0; i < grid.length; i++) for (let j = i + 1; j < grid.length; j++) {
    const a = grid[i], b = grid[j]
    if (a[same] !== b[same] || a[idx] === b[idx]) continue
    const s = (b[pos] - a[pos]) / (b[idx] - a[idx])
    if (s > 0) steps.push(s)
  }
  return median(steps)
}

/* Calcule, arbre par arbre, la case de chaque arbre libre à partir de ses voisins en grille */
export function planGridSnap(trees, tol = 0.35) {
  const grid = trees.filter(t => t.row != null && t.col != null)
  const free = trees.filter(t => t.row == null || t.col == null)
  const taken = new Map(grid.map(t => [`${t.row}:${t.col}`, t]))
  const gsx = spacing(grid, 'x'), gsy = spacing(grid, 'y')
  const assign = [], skipped = []
  const lbl = (r, c) => `L${r + 1}C${c + 1}`
  const skip = (t, reason) => skipped.push({ tree: t, reason })

  if (!grid.length || !gsx || !gsy) return { assign, skipped: free.map(t => ({ tree: t, reason: 'pas assez d\'arbres en grille' })) }

  free.forEach(t => {
    const near = grid
      .map(g => ({ g, d: Math.hypot((g.xm - t.xm) / gsx, (g.ym - t.ym) / gsy) }))
      .sort((a, b) => a.d - b.d).slice(0, 12)
    if (near[0].d > 4) return skip(t, 'trop loin de la grille')
    const local = near.map(n => n.g)
    const sx = spacing(local, 'x') || gsx, sy = spacing(local, 'y') || gsy

    // Chaque voisin "vote" pour une case ; les plus proches comptent le plus
    const votes = {}
    near.filter(n => n.d <= 3).forEach(({ g }, i) => {
      const c = g.col + (t.xm - g.xm) / sx, r = g.row + (t.ym - g.ym) / sy
      if (Math.abs(c - Math.round(c)) > tol || Math.abs(r - Math.round(r)) > tol) return
      const k = `${Math.round(r)}:${Math.round(c)}`
      votes[k] = (votes[k] || 0) + 1 / (i + 1)
    })
    const best = Object.entries(votes).sort((a, b) => b[1] - a[1])[0]
    if (!best) return skip(t, 'entre deux cases')
    const [row, col] = best[0].split(':').map(Number)
    if (row < 0 || col < 0) return skip(t, 'hors de la grille')
    if (taken.has(best[0])) return skip(t, `case ${lbl(row, col)} déjà occupée`)
    taken.set(best[0], t)
    assign.push({ id: t.id, row, col })
  })
  return { assign, skipped }
}