import { useState, useEffect, useRef } from 'react'
import { loadData, saveData, setSyncedUid, backupLocal, hasContent } from '../utils/storage'
import { cloudEnabled, onUser, watchCloud, pushCloud, serialize } from '../utils/cloud'
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

  /* ── Synchro cloud ── */
  const [cloud, setCloud] = useState({ user: null, status: cloudEnabled ? 'signed-out' : 'disabled', error: null })
  const uidRef   = useRef(null)   // utilisateur connecté
  const readyRef = useRef(false)  // première comparaison local ↔ cloud faite

  function push(rec) {
    if (!uidRef.current || !readyRef.current) return
    pushCloud(uidRef.current, rec).catch(err => {
      setCloud(c => ({ ...c, status: err?.code === 'permission-denied' ? 'denied' : 'error', error: err?.message }))
    })
  }

  function persist(t, j, m, w, h) {
    push(saveData({ trees: t, journal: j, meteo: m, fw: w, fh: h }))
  }

  /* Remplace l'état par une version reçue du cloud (sans la renvoyer au cloud) */
  function applyRemote(remote) {
    const p = remote.data
    const newT = renumber(p.trees || [])
    setTreesRaw(newT); setJournal(p.journal || []); setMeteo(p.meteo || [])
    setFw(p.fw || 50); setFh(p.fh || 40)
    saveData({ trees: newT, journal: p.journal || [], meteo: p.meteo || [], fw: p.fw || 50, fh: p.fh || 40 },
             { updatedAt: remote.updatedAt })
  }

  useEffect(() => {
    if (!cloudEnabled) return
    let unsubSnap = null

    const unsubAuth = onUser(user => {
      unsubSnap?.(); unsubSnap = null
      readyRef.current = false
      uidRef.current = user?.uid || null
      if (!user) { setCloud({ user: null, status: 'signed-out', error: null }); return }
      setCloud({ user, status: 'connecting', error: null })

      unsubSnap = watchCloud(user.uid, ({ exists, remote, pending, fromCache }) => {
        const local = loadData() || { trees: [], journal: [], meteo: [], fw: 50, fh: 40, updatedAt: 0 }

        if (!readyRef.current) {
          // On attend la réponse du serveur avant de décider quoi garder
          if (fromCache) { setCloud(c => ({ ...c, status: 'offline' })); return }

          if (!exists || !remote) {
            // Premier passage : on envoie les données actuelles du téléphone
            readyRef.current = true
            push(saveData(local, { updatedAt: local.updatedAt || Date.now(), syncedUid: user.uid }))
          } else {
            const firstTime = local.syncedUid !== user.uid
            const differ = serialize(local) !== remote.payload
            let keepCloud = remote.updatedAt >= local.updatedAt
            if (firstTime && differ && hasContent(local) && hasContent(remote.data)) {
              keepCloud = confirm(
                `Des données existent déjà dans le cloud (${remote.data.trees?.length || 0} arbre(s)) ` +
                `et sur ce téléphone (${local.trees.length} arbre(s)).\n\n` +
                `OK = garder celles du cloud\nAnnuler = garder celles du téléphone`
              )
            } else if (firstTime && !hasContent(local)) {
              keepCloud = true
            }
            readyRef.current = true
            if (keepCloud) {
              if (differ) { backupLocal(); applyRemote(remote) }
              setSyncedUid(user.uid)
            } else {
              push(saveData(local, { syncedUid: user.uid }))
            }
          }
        } else if (exists && remote && !pending && remote.updatedAt > local.updatedAt) {
          // Modification faite depuis un autre appareil
          applyRemote(remote)
        }

        setCloud(c => ({ ...c, status: pending ? 'pending' : fromCache ? 'offline' : 'synced', error: null }))
      }, err => {
        setCloud(c => ({ ...c, status: err?.code === 'permission-denied' ? 'denied' : 'error', error: err?.message }))
      })
    })

    return () => { unsubAuth(); unsubSnap?.() }
  }, [])

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
    persist(newT, p.journal || [], p.meteo || [], p.fw || fw, p.fh || fh)
    return newT.length
  }

  function clearAll() {
    setTreesRaw([]); setJournal([]); setMeteo([]); setFw(50); setFh(40)
    persist([], [], [], 50, 40)
  }

  return {
    trees, journal, meteo, fw, fh, cloud,
    addTree, moveTree, updateTree, deleteTree, placeGrid,
    saveJournalEntry, deleteJournalEntry,
    saveMeteoEntry, deleteMeteoEntry,
    importAll, clearAll,
  }
}