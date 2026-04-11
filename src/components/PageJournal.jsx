import { useState } from 'react'
import { fmt } from '../utils/helpers'

export default function PageJournal({ journal, active, onAdd, onEdit, onDelete }) {
  const [q, setQ] = useState('')
  const filtered = journal.filter(e => !q || (e.tit + e.body + e.cat).toLowerCase().includes(q.toLowerCase()))
  const cats = [...new Set(journal.map(e => e.cat).filter(Boolean))]

  return (
    <div id="page-journal" className={`page page-journal${active ? ' active' : ''}`}>
      <div className="jtb">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher…" />
        <button className="btn-aj" onClick={onAdd}>＋ Entrée</button>
      </div>
      <div className="jtoc">
        {cats.map(c => <div key={c} className="tchip" onClick={() => setQ(c)}>{c}</div>)}
      </div>
      <div className="jscroll">
        {filtered.length === 0
          ? <div className="empty"><div className="ei">📓</div><p>Aucune entrée.<br />Appuyez <strong>＋ Entrée</strong>.</p></div>
          : filtered.map(e => (
            <div key={e.id} className="je">
              <div className="jeh">
                {e.cat && <span className="jecat">{e.cat}</span>}
                <div className="jetit">{e.tit || '(sans titre)'}</div>
                <div className="jedate">{fmt(e.date)}{e.trees ? ` · 🌳 ${e.trees}` : ''}</div>
              </div>
              <div className="jebody">{e.body || ''}</div>
              <div className="jeact">
                <button className="ja" onClick={() => onEdit(e.id)}>✏️ Modifier</button>
                <button className="ja del" onClick={() => onDelete(e.id)}>🗑 Supprimer</button>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}
