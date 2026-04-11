import { useState } from 'react'
import { loadData, saveData } from '../utils/storage'
import { renumber, uid, today, fmt } from '../utils/helpers'
import { HEALTH_DEFS, GRASS_DEFS } from '../utils/constants'

function makeTree(xm, ym, extra = {}) {
  return {
    id: uid(), xm, ym,
    name: '', hauteur: '', diametre: '',
    datePlantation: '', sante: '', grass: 'g0',
    notes: '', row: null, col: null, history: [],
    ...extra,
  }
}

export function useData() {
  const stored = loadData()
  const [trees,   setTreesRaw]   = useState(() => renumber(stored?.trees   || []))
  const [journal, setJournal]    = useState(stored?.journal || [])
  const [meteo,   setMeteo]      = useState(stored?.meteo   || [])
  const [fw,      setFw]         = useState(stored?.fw || 50)
  const [fh,      setFh]         = useState(stored?.fh || 40)

  function setTrees(t) { setTreesRaw(renumber(t)) }

  function persist(t, j, m, w, h) {
    saveData({ trees: t, journal: j, meteo: m, fw: w, fh: h })
  }

  /* ── Arbres ── */
  function addTree(xm, ym) {
    const t = makeTree(xm, ym)
    const next = renumber([...trees, t])
    setTreesRaw(next)
    persist(next, journal, meteo, fw, fh)
    return t
  }

  function moveTree(id, xm, ym) {
    const next = renumber(trees.map(t =>
      t.id === id ? { ...t, xm: Math.max(0, Math.min(fw, xm)), ym: Math.max(0, Math.min(fh, ym)) } : t
    ))
    setTreesRaw(next)
    persist(next, journal, meteo, fw, fh)
  }

  function treeSum(data) {
    const p = []
    if (data.hauteur) p.push(`H:${data.hauteur}cm`)
    if (data.sante) { const h = HEALTH_DEFS.find(x => x.key === data.sante); if (h) p.push(h.label) }
    if (data.grass)  { const g = GRASS_DEFS.find(x => x.key === data.grass);  if (g) p.push('Herbe:' + g.label) }
    if (data.notes)  p.push(data.notes.slice(0, 50))
    return p.join(' · ') || '—'
  }

  function updateTree(original, data) {
    const prev = treeSum(original)
    const cur  = treeSum(data)
    const hist = [...(original.history || [])]
    if (cur !== prev) hist.push({ date: fmt(today()), sum: cur })
    const next = renumber(trees.map(t => t.id === original.id ? { ...original, ...data, history: hist } : t))
    setTreesRaw(next)
    persist(next, journal, meteo, fw, fh)
  }

  function deleteTree(id) {
    const next = renumber(trees.filter(t => t.id !== id))
    setTreesRaw(next)
    persist(next, journal, meteo, fw, fh)
  }

  /* ── Grille ── */
  function placeGrid({ cfg, pos, offsetX, replace }) {
    let newTrees, newFw = fw, newFh = fh
    if (replace) {
      newFw = cfg.fw; newFh = cfg.fh
      newTrees = pos.map(p => makeTree(p.xm - offsetX, p.ym, { row: p.row, col: p.col }))
    } else {
      const maxX = Math.max(...pos.map(p => p.xm))
      const maxY = Math.max(...pos.map(p => p.ym))
      newFw = Math.max(fw, maxX + cfg.sx)
      newFh = Math.max(fh, maxY + cfg.sy)
      newTrees = [...trees, ...pos.map(p => makeTree(p.xm, p.ym, { row: p.row, col: p.col }))]
    }
    const final = renumber(newTrees)
    setTreesRaw(final); setFw(newFw); setFh(newFh)
    persist(final, journal, meteo, newFw, newFh)
    return { trees: final, fw: newFw, fh: newFh }
  }

  /* ── Journal ── */
  function saveJournalEntry(data, editId) {
    let next
    if (editId) { next = journal.map(e => e.id === editId ? { ...e, ...data } : e) }
    else next = [...journal, { id: uid(), ...data }]
    next.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    setJournal(next)
    persist(trees, next, meteo, fw, fh)
  }

  function deleteJournalEntry(id) {
    const next = journal.filter(e => e.id !== id)
    setJournal(next)
    persist(trees, next, meteo, fw, fh)
  }

  /* ── Météo ── */
  function saveMeteoEntry(data) {
    const next = [...meteo, { id: uid(), ...data }]
      .sort((a, b) => b.period.sortKey.localeCompare(a.period.sortKey))
    setMeteo(next)
    persist(trees, journal, next, fw, fh)
  }

  function deleteMeteoEntry(id) {
    const next = meteo.filter(e => e.id !== id)
    setMeteo(next)
    persist(trees, journal, next, fw, fh)
  }

  /* ── Import/Export ── */
  function importAll(p) {
    const newT = renumber(p.trees || [])
    setTreesRaw(newT); setJournal(p.journal || []); setMeteo(p.meteo || [])
    if (p.fw) setFw(p.fw); if (p.fh) setFh(p.fh)
    saveData({ trees: newT, journal: p.journal || [], meteo: p.meteo || [], fw: p.fw || fw, fh: p.fh || fh })
    return newT.length
  }

  function clearAll() {
    setTreesRaw([]); setJournal([]); setMeteo([])
    saveData({ trees: [], journal: [], meteo: [], fw: 50, fh: 40 })
  }

  return {
    trees, journal, meteo, fw, fh,
    addTree, moveTree, updateTree, deleteTree, placeGrid,
    saveJournalEntry, deleteJournalEntry,
    saveMeteoEntry, deleteMeteoEntry,
    importAll, clearAll,
  }
}
