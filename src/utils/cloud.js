import { initializeApp } from 'firebase/app'
import {
  getAuth, GoogleAuthProvider, onAuthStateChanged,
  signInWithPopup, signInWithRedirect, signOut as fbSignOut,
} from 'firebase/auth'
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  doc, setDoc, getDoc, deleteDoc, onSnapshot, Bytes,
} from 'firebase/firestore'
import { firebaseConfig } from '../firebase.config'

export const cloudEnabled = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== 'A_REMPLIR'

let auth = null
let db = null

if (cloudEnabled) {
  const app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  // Cache local persistant : l'app fonctionne hors-ligne, les écritures partent au retour du réseau.
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  })
}

const userDoc = uid => doc(db, 'users', uid)

export function onUser(cb) {
  if (!auth) return () => {}
  return onAuthStateChanged(auth, cb)
}

export async function signIn() {
  const provider = new GoogleAuthProvider()
  try {
    await signInWithPopup(auth, provider)
  } catch (e) {
    // Certains navigateurs / modes "app installée" bloquent les popups
    if (e?.code === 'auth/popup-blocked' || e?.code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, provider)
    } else if (e?.code !== 'auth/popup-closed-by-user' && e?.code !== 'auth/cancelled-popup-request') {
      throw e
    }
  }
}

export function signOut() {
  return auth ? fbSignOut(auth) : Promise.resolve()
}

/* Les données sont stockées dans un seul document users/{uid} :
   { payload: <JSON des données>, updatedAt: <ms>, schema: 1 } */

export function serialize({ trees, journal, meteo, fw, fh }) {
  return JSON.stringify({ trees, journal, meteo, fw, fh })
}

export function pushCloud(uid, rec) {
  return setDoc(userDoc(uid), {
    payload:   serialize(rec),
    updatedAt: Math.round(rec.updatedAt || Date.now()),
    schema:    1,
  })
}

export function watchCloud(uid, onData, onError) {
  return onSnapshot(userDoc(uid), { includeMetadataChanges: true }, snap => {
    let remote = null
    if (snap.exists()) {
      const d = snap.data()
      try {
        remote = { data: JSON.parse(d.payload || '{}'), payload: d.payload, updatedAt: d.updatedAt || 0 }
      } catch { remote = null }
    }
    onData({
      exists:    snap.exists(),
      remote,
      pending:   snap.metadata.hasPendingWrites,
      fromCache: snap.metadata.fromCache,
    })
  }, onError)
}
/* ── Photos du journal ──────────────────────────────────────────────
   Une photo = un document users/{uid}/photos/{id} : { img: <octets JPEG>, type, createdAt }.
   Stockées dans Firestore (forfait gratuit), gardées en cache sur le téléphone. */

const photoDoc = (uid, id) => doc(db, 'users', uid, 'photos', id)
const photoUrls = new Map()   // id → URL affichable (cache mémoire)

export function rememberPhoto(id, blob) {
  photoUrls.set(id, URL.createObjectURL(blob))
}

/* Envoi sans attendre le réseau : hors-ligne, l'envoi part au retour de la connexion */
export async function savePhoto(uid, id, blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  rememberPhoto(id, blob)
  setDoc(photoDoc(uid, id), { img: Bytes.fromUint8Array(bytes), type: blob.type || 'image/jpeg', createdAt: Date.now() })
    .catch(err => console.warn('Photo non enregistrée', id, err))
}

export async function loadPhoto(uid, id) {
  if (photoUrls.has(id)) return photoUrls.get(id)
  if (!db || !uid) return null
  const snap = await getDoc(photoDoc(uid, id))
  if (!snap.exists()) return null
  const d = snap.data()
  const url = URL.createObjectURL(new Blob([d.img.toUint8Array()], { type: d.type || 'image/jpeg' }))
  photoUrls.set(id, url)
  return url
}

export function deletePhoto(uid, id) {
  photoUrls.delete(id)
  if (!db || !uid) return
  deleteDoc(photoDoc(uid, id)).catch(err => console.warn('Photo non supprimée', id, err))
}
