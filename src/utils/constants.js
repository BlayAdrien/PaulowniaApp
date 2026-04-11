export const STORE_KEY = 'arbre-v7'
export const STORE_OLD = 'arbre-v5'

export const HEALTH_DEFS = [
  { key: 'mort',  label: 'Mort',         emoji: '💀', crown: '#111111', trunk: '#000000' },
  { key: 'tbad',  label: 'Très mauvais', emoji: '🪵', crown: '#5c2a0a', trunk: '#3a1505' },
  { key: 'bad',   label: 'Mauvais',      emoji: '🫤', crown: '#8b4513', trunk: '#5c2a0a' },
  { key: 'bon',   label: 'Bon',          emoji: '🌿', crown: '#4a8a20', trunk: '#2d5a10' },
  { key: 'excel', label: 'Excellent',    emoji: '🌟', crown: '#22a03a', trunk: '#0d5c20' },
]

export const GRASS_DEFS = [
  { key: 'g0', label: 'Aucune',   desc: 'Toile nette' },
  { key: 'g1', label: 'Un peu',   desc: 'Quelques brins' },
  { key: 'g2', label: 'Moyen',    desc: 'Herbe visible' },
  { key: 'g3', label: 'Beaucoup', desc: 'Envahi' },
]

// ratio de vert qui grandit du centre vers l'extérieur
export const GRASS_STYLE = [
  { greenRatio: 0.0 },   // g0 : tout noir
  { greenRatio: 0.35 },  // g1 : cœur vert 35%
  { greenRatio: 0.65 },  // g2 : vert 65%
  { greenRatio: 0.85 },  // g3 : vert 85%, fin anneau noir
]

export const HEALTH_ORDER = { mort: 0, tbad: 1, bad: 2, bon: 3, excel: 4 }

export const TARGET_PX = 90
export const MARGIN    = 28
