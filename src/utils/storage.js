import { STORE_KEY, STORE_OLD } from './constants'
import { renumber } from './helpers'

export function loadData() {
  try {
    const raw = localStorage.getItem(STORE_KEY) || localStorage.getItem(STORE_OLD)
    if (!raw) return null
    const p = JSON.parse(raw)
    return {
      trees:   renumber(p.trees   || []),
      journal: p.journal || [],
      meteo:   p.meteo   || [],
      fw:      p.fw  || 50,
      fh:      p.fh  || 40,
    }
  } catch { return null }
}

export function saveData({ trees, journal, meteo, fw, fh }) {
  localStorage.setItem(STORE_KEY, JSON.stringify({ trees, journal, meteo, fw, fh }))
}
