import { useState, useEffect } from 'react'
import Sheet from './Sheet'
import { today } from '../utils/helpers'

export default function JournalSheet({ open, editEntry, onClose, onSave }) {
  const [cat,   setCat]   = useState('')
  const [tit,   setTit]   = useState('')
  const [body,  setBody]  = useState('')
  const [date,  setDate]  = useState(today())
  const [trees, setTrees] = useState('')

  useEffect(() => {
    if (editEntry) {
      setCat(editEntry.cat || ''); setTit(editEntry.tit || '')
      setBody(editEntry.body || ''); setDate(editEntry.date || today())
      setTrees(editEntry.trees || '')
    } else {
      setCat(''); setTit(''); setBody(''); setDate(today()); setTrees('')
    }
  }, [editEntry, open])

  return (
    <Sheet open={open} onClose={onClose} title={editEntry ? '✏️ Modifier' : '📓 Nouvelle entrée'}>
      <div className="fb">
        <div className="fr full">
          <div className="fld"><label>Catégorie</label><input value={cat} onChange={e => setCat(e.target.value)} placeholder="Taille, Traitement…" /></div>
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
      </div>
      <div className="brow">
        <button className="bp" onClick={() => onSave({ cat, tit, body, date, trees })}>💾 Enregistrer</button>
      </div>
    </Sheet>
  )
}
