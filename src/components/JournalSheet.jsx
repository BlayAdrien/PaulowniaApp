import { useState, useEffect } from 'react'
import Sheet from './Sheet'
import { today, uid as newId } from '../utils/helpers'
import { compressImage } from '../utils/image'
import { rememberPhoto } from '../utils/cloud'
import { Thumb } from './Photos'

export default function JournalSheet({ open, editEntry, defaultCat = '', cats = [], uid, onClose, onSave }) {
  const [cat,   setCat]   = useState('')
  const [tit,   setTit]   = useState('')
  const [body,  setBody]  = useState('')
  const [date,  setDate]  = useState(today())
  const [trees, setTrees] = useState('')
  const [photos, setPhotos] = useState([])        // ids des photos de l'entrée
  const [added,  setAdded]  = useState({})        // id → blob des photos ajoutées (pas encore envoyées)
  const [busy,   setBusy]   = useState(false)

  useEffect(() => {
    if (editEntry) {
      setCat(editEntry.cat || ''); setTit(editEntry.tit || '')
      setBody(editEntry.body || ''); setDate(editEntry.date || today())
      setTrees(editEntry.trees || ''); setPhotos(editEntry.photos || [])
    } else {
      setCat(defaultCat); setTit(''); setBody(''); setDate(today()); setTrees(''); setPhotos([])
    }
    setAdded({})
  }, [editEntry, open, defaultCat])

  async function addFiles(files) {
    setBusy(true)
    try {
      for (const f of files) {
        const blob = await compressImage(f)
        if (!blob) continue
        const id = newId()
        rememberPhoto(id, blob)
        setAdded(a => ({ ...a, [id]: blob }))
        setPhotos(p => [...p, id])
      }
    } finally { setBusy(false) }
  }

  const removed = (editEntry?.photos || []).filter(id => !photos.includes(id))

  return (
    <Sheet open={open} onClose={onClose} title={editEntry ? '✏️ Modifier' : '📓 Nouvelle entrée'}>
      <div className="fb">
        <div className="fr full">
          <div className="fld"><label>Catégorie</label><input value={cat} onChange={e => setCat(e.target.value)} placeholder="Taille, Traitement…" list="jcats" />
            <datalist id="jcats">{cats.map(c => <option key={c} value={c} />)}</datalist>
          </div>        
        </div>
        <div className="fr full">
          <div className="fld"><label>Titre</label><input value={tit} onChange={e => setTit(e.target.value)} placeholder="ex: Première taille de formation" /></div>
        </div>
        <div className="fr full">
          <div className="fld"><label>Contenu</label><textarea value={body} onChange={e => setBody(e.target.value)} style={{ height: 120 }} placeholder="Détails…" /></div>
        </div>
        <div className="fr">
          <div className="fld"><label>Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
          <div className="fld"><label>Arbres concernés</label><input value={trees} onChange={e => setTrees(e.target.value)} placeholder="ex: L1C3, L2C5…" /></div>
        </div>
        <div className="fr full">
          <div className="fld">
            <label>Photos</label>
            {uid ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                {photos.map(id => (
                  <div key={id} style={{ position: 'relative' }}>
                    <Thumb uid={uid} id={id} size={64} />
                    <button onClick={() => setPhotos(p => p.filter(x => x !== id))} style={{
                      position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, border: 'none',
                      background: 'var(--red)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✕</button>
                  </div>
                ))}
                <label style={{ width: 64, height: 64, borderRadius: 8, border: '1.5px dashed var(--sand)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', fontSize: busy ? 11 : 24, color: 'var(--barkl)', cursor: 'pointer' }}>
                  {busy ? '…' : '＋'}
                  <input type="file" accept="image/*" multiple style={{ display: 'none' }}
                         onChange={e => { addFiles([...e.target.files]); e.target.value = '' }} />
                </label>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--barkl)' }}>Connectez-vous au cloud (Réglages) pour ajouter des photos.</div>
            )}
          </div>
        </div>
      </div>
      <div className="brow">
        <button className="bp" disabled={busy} onClick={() => onSave({ cat, tit, body, date, trees, photos }, { added, removed })}>💾 Enregistrer</button>
      </div>
    </Sheet>
  )
}
