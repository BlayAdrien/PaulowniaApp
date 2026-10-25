import { useState } from 'react'
import { fmt } from '../utils/helpers'
import { Thumb, Lightbox } from './Photos'

const NOCAT = 'Sans catégorie'
const catKey = e => ((e.cat || '').trim() || NOCAT).toLowerCase()
const byDateDesc = (a, b) => (b.date || '').localeCompare(a.date || '')

function Entry({ e, showCat, uid, onEdit, onDelete, onPhoto }) {
  const photos = e.photos || []
  return (
    <div className="je">
      <div className="jeh">
        {showCat && e.cat && <span className="jecat">{e.cat}</span>}
        <div className="jetit">{e.tit || '(sans titre)'}</div>
        <div className="jedate">{fmt(e.date)}{e.trees ? ` · 🌳 ${e.trees}` : ''}</div>
      </div>
      <div className="jebody" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>{e.body || ''}</div>
        {photos.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {photos.slice(0, 3).map((id, i) => (
              <Thumb key={id} uid={uid} id={id} more={i === 2 ? photos.length - 3 : 0} onClick={() => onPhoto(photos, i)} />
            ))}
          </div>
        )}
      </div>
      <div className="jeact">
        <button className="ja" onClick={() => onEdit(e.id)}>✏️ Modifier</button>
        <button className="ja del" onClick={() => onDelete(e.id)}>🗑 Supprimer</button>
      </div>
    </div>
  )
}

export default function PageJournal({ journal, active, uid, onAdd, onEdit, onDelete }) {
  const [box, setBox]         = useState(null)        // photos affichées en grand
  const [q, setQ]             = useState('')
  const [openKey, setOpenKey] = useState(null)      // dossier ouvert
  const [order, setOrder]     = useState('recent')  // tri des dossiers

  /* Regroupe les entrées par catégorie (sans tenir compte des majuscules) */
  const folders = {}
  journal.forEach(e => {
    const k = catKey(e)
    if (!folders[k]) folders[k] = { key: k, name: (e.cat || '').trim() || NOCAT, entries: [] }
    folders[k].entries.push(e)
  })
  const folderList = Object.values(folders).map(f => {
    const sorted = [...f.entries].sort(byDateDesc)
    return { ...f, entries: sorted, last: sorted[0]?.date || '' }
  })
  folderList.sort((a, b) => order === 'recent' ? b.last.localeCompare(a.last) : a.last.localeCompare(b.last))

  const open = openKey && folders[openKey] ? folderList.find(f => f.key === openKey) : null
  const searching = q.trim() !== ''
  const results = searching
    ? journal.filter(e => (e.tit + ' ' + e.body + ' ' + e.cat).toLowerCase().includes(q.toLowerCase())).sort(byDateDesc)
    : []

  const chip = sel => ({
    background: sel ? 'var(--moss)' : 'var(--parch)', color: sel ? '#fff' : 'var(--bark)',
  })

  return (
    <div id="page-journal" className={`page page-journal${active ? ' active' : ''}`}>
      <div className="jtb">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher…" />
        <button className="btn-aj" onClick={() => onAdd(open && open.name !== NOCAT ? open.name : '')}>＋ Entrée</button>
      </div>

      <div className="jtoc" style={{ alignItems: 'center' }}>
        {searching ? (
          <span style={{ fontSize: 11, color: 'var(--bark)' }}>{results.length} résultat{results.length !== 1 ? 's' : ''}</span>
        ) : open ? (
          <>
            <div className="tchip" onClick={() => setOpenKey(null)}>← Catégories</div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap' }}>📂 {open.name}</span>
          </>
        ) : (
          <>
            <span style={{ fontSize: 10, color: 'var(--barkl)', whiteSpace: 'nowrap' }}>Trier :</span>
            <div className="tchip" style={chip(order === 'recent')} onClick={() => setOrder('recent')}>Plus récentes</div>
            <div className="tchip" style={chip(order === 'old')} onClick={() => setOrder('old')}>Plus anciennes</div>
          </>
        )}
      </div>

      <div className="jscroll">
        {journal.length === 0 ? (
          <div className="empty"><div className="ei">📓</div><p>Aucune entrée.<br />Appuyez <strong>＋ Entrée</strong>.</p></div>
        ) : searching ? (
          results.length
            ? results.map(e => <Entry key={e.id} e={e} showCat uid={uid} onEdit={onEdit} onDelete={onDelete} onPhoto={(ids, index) => setBox({ ids, index })} />)
            : <div className="empty"><div className="ei">🔍</div><p>Aucun résultat.</p></div>
        ) : open ? (
          open.entries.map(e => <Entry key={e.id} e={e} uid={uid} onEdit={onEdit} onDelete={onDelete} onPhoto={(ids, index) => setBox({ ids, index })} />)
        ) : (
          folderList.map(f => (
            <div key={f.key} className="je" onClick={() => setOpenKey(f.key)}
                 style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer' }}>
              <span style={{ fontSize: 26 }}>📁</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="jetit" style={{ margin: 0 }}>{f.name}</div>
                <div className="jedate">
                  {f.entries.length} sujet{f.entries.length !== 1 ? 's' : ''}{f.last ? ` · dernier : ${fmt(f.last)}` : ''}
                </div>
              </div>
              <span style={{ fontSize: 20, color: 'var(--barkl)' }}>›</span>
            </div>
          ))
        )}
      </div>
      {box && <Lightbox uid={uid} ids={box.ids} index={box.index}
                        onIndex={index => setBox(b => ({ ...b, index }))} onClose={() => setBox(null)} />}
    </div>
  )
}