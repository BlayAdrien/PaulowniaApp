import { STORE_KEY, STORE_OLD } from './constants'
import { renumber } from './helpers'

function readRaw() {
  try {
    const raw = localStorage.getItem(STORE_KEY) || localStorage.getItem(STORE_OLD)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function loadData() {
  const p = readRaw()
  if (!p) return null
  return {
    trees:     renumber(p.trees   || []),
    journal:   p.journal || [],
    meteo:     p.meteo   || [],
    fw:        p.fw  || 50,
    fh:        p.fh  || 40,
    updatedAt: p.updatedAt || 0,
    syncedUid: p.syncedUid || null,
  }
}

export function saveData({ trees, journal, meteo, fw, fh }, meta = {}) {
  const prev = readRaw() || {}
  const rec = {
    trees, journal, meteo, fw, fh,
    updatedAt: meta.updatedAt ?? Date.now(),
    syncedUid: meta.syncedUid !== undefined ? meta.syncedUid : (prev.syncedUid || null),
  }
  localStorage.setItem(STORE_KEY, JSON.stringify(rec))
  return rec
}

export function setSyncedUid(uid) {
  const p = readRaw()
  if (!p) return
  p.syncedUid = uid
  localStorage.setItem(STORE_KEY, JSON.stringify(p))
}

/* Copie de sécurité locale avant d'écraser les données du téléphone par celles du cloud */
export function backupLocal() {
  const raw = localStorage.getItem(STORE_KEY)
  if (raw) localStorage.setItem(`${STORE_KEY}-backup-${Date.now()}`, raw)
}

export function hasContent(d) {
  return !!d && ((d.trees?.length || 0) + (d.journal?.length || 0) + (d.meteo?.length || 0)) > 0
}

/* Demande au navigateur de ne pas effacer ces données automatiquement */
export function requestPersistentStorage() {
  try { navigator.storage?.persist?.() } catch { /* ignoré */ }
}