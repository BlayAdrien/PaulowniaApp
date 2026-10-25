import { useState, useEffect, useRef } from 'react'
import { loadPhoto } from '../utils/cloud'

/* Charge l'URL d'une photo (cache, puis Firestore) */
function usePhotoUrl(uid, id) {
  const [url, setUrl] = useState(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let alive = true
    setFailed(false)
    loadPhoto(uid, id)
      .then(u => { if (alive) { setUrl(u); if (!u) setFailed(true) } })
      .catch(() => { if (alive) setFailed(true) })
    return () => { alive = false }
  }, [uid, id])
  return { url, failed }
}

/* Vignette carrée */
export function Thumb({ uid, id, size = 72, more = 0, onClick }) {
  const { url, failed } = usePhotoUrl(uid, id)
  return (
    <div onClick={onClick} style={{
      width: size, height: size, borderRadius: 8, overflow: 'hidden', position: 'relative', flexShrink: 0,
      background: 'var(--parch)', cursor: 'pointer', border: '1px solid var(--sand)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--barkl)',
    }}>
      {url
        ? <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : failed ? 'indisponible' : '…'}
      {more > 0 && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>
          +{more}
        </div>
      )}
    </div>
  )
}

/* Affichage plein écran, avec photo précédente / suivante (boutons ou glissé) */
export function Lightbox({ uid, ids, index, onClose, onIndex }) {
  const id = ids[index]
  const { url, failed } = usePhotoUrl(uid, id)
  const startX = useRef(null)
  const go = d => onIndex((index + d + ids.length) % ids.length)

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && ids.length > 1) go(-1)
      if (e.key === 'ArrowRight' && ids.length > 1) go(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const btn = { position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: 22,
                border: 'none', background: 'rgba(255,255,255,.18)', color: '#fff', fontSize: 26, cursor: 'pointer' }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      onTouchStart={e => { startX.current = e.touches[0].clientX }}
      onTouchEnd={e => {
        const dx = e.changedTouches[0].clientX - (startX.current ?? 0)
        if (ids.length > 1 && Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
      }}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,8,4,.94)',
               display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {url
        ? <img src={url} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} onClick={onClose} />
        : <span style={{ color: '#ccc', fontSize: 13 }}>{failed ? 'Photo indisponible' : 'Chargement…'}</span>}
      <button onClick={onClose} style={{ ...btn, top: 16, right: 16, transform: 'none', fontSize: 20 }}>✕</button>
      {ids.length > 1 && <>
        <button onClick={() => go(-1)} style={{ ...btn, left: 10 }}>‹</button>
        <button onClick={() => go(1)}  style={{ ...btn, right: 10 }}>›</button>
        <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, textAlign: 'center', color: '#ddd', fontSize: 12 }}>
          {index + 1} / {ids.length}
        </div>
      </>}
    </div>
  )
}
