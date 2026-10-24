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

/* Déduit la grille (espacement + origine) à partir des arbres déjà en grille */
function fitAxis(pairs) {
  const n = pairs.length
  if (n < 2) return null
  const mi = pairs.reduce((s, [i]) => s + i, 0) / n
  const mp = pairs.reduce((s, [, p]) => s + p, 0) / n
  let cov = 0, v = 0
  pairs.forEach(([i, p]) => { cov += (i - mi) * (p - mp); v += (i - mi) ** 2 })
  if (!v) return null
  const step = cov / v
  const origin = mp - step * mi
  const maxErr = Math.max(...pairs.map(([i, p]) => Math.abs(origin + step * i - p)))
  return { step, origin, maxErr }
}

/* Calcule la ligne/colonne de chaque arbre libre (sans rien modifier) */
export function planGridSnap(trees, tol = 0.35) {
  const grid = trees.filter(t => t.row != null && t.col != null)
  const fx = fitAxis(grid.map(t => [t.col, t.xm]))
  const fy = fitAxis(grid.map(t => [t.row, t.ym]))
  if (!fx || !fy) return { error: 'nogrid' }
  if (fx.maxErr > Math.abs(fx.step) * tol || fy.maxErr > Math.abs(fy.step) * tol) return { error: 'irregular' }
  const taken = new Set(grid.map(t => `${t.row}:${t.col}`))
  const assign = [], skipped = []
  trees.filter(t => t.row == null || t.col == null).forEach(t => {
    const c = (t.xm - fx.origin) / fx.step, r = (t.ym - fy.origin) / fy.step
    const col = Math.round(c), row = Math.round(r), key = `${row}:${col}`
    if (row < 0 || col < 0 || Math.abs(c - col) > tol || Math.abs(r - row) > tol || taken.has(key)) { skipped.push(t); return }
    taken.add(key); assign.push({ id: t.id, row, col })
  })
  return { assign, skipped }
}