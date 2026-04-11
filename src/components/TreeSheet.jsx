import { useState, useEffect } from 'react'
import Sheet from './Sheet'
import GrassIcon from './GrassIcon'
import { HEALTH_DEFS, GRASS_DEFS } from '../utils/constants'
import { fmt } from '../utils/helpers'

export default function TreeSheet({ tree, onClose, onSave, onDelete }) {
  const [name,     setName]     = useState('')
  const [hauteur,  setHauteur]  = useState('')
  const [diametre, setDiametre] = useState('')
  const [date,     setDate]     = useState('')
  const [sante,    setSante]    = useState('')
  const [grass,    setGrass]    = useState('g0')
  const [notes,    setNotes]    = useState('')

  useEffect(() => {
    if (!tree) return
    setName(tree.name || '')
    setHauteur(tree.hauteur || '')
    setDiametre(tree.diametre || '')
    setDate(tree.datePlantation || '')
    setSante(tree.sante || '')
    setGrass(tree.grass || 'g0')
    setNotes(tree.notes || '')
  }, [tree])

  if (!tree) return null

  const dispName = tree.name || tree._label || 'Arbre ?'

  return (
    <Sheet open={!!tree} onClose={onClose} title={dispName}>
      <div>
        {tree.row != null
          ? <span className="pbadge pbg">🟩 Grille · L{tree.row + 1}C{tree.col + 1}</span>
          : <span className="pbadge pbf">🟧 Libre · {tree._label || '?'}</span>
        }
      </div>

      <div className="fb">
        <div className="fr">
          <div className="fld">
            <label>Nom / ID</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="ex: A-01" />
          </div>
          <div className="fld">
            <label>Date plantation</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>

        <div className="fr">
          <div className="fld">
            <label>Hauteur (cm)</label>
            <input type="number" value={hauteur} onChange={e => setHauteur(e.target.value)} min="0" inputMode="numeric" placeholder="0" />
          </div>
          <div className="fld">
            <label>Diamètre (cm)</label>
            <input type="number" value={diametre} onChange={e => setDiametre(e.target.value)} min="0" inputMode="numeric" placeholder="0" />
          </div>
        </div>

        {/* Santé */}
        <div className="fr full">
          <div className="fld">
            <label>État de santé de l'arbre</label>
            <div className="hrow">
              {HEALTH_DEFS.map(h => (
                <div
                  key={h.key}
                  className={`hchip${sante === h.key ? ' sel' : ''}`}
                  onClick={() => setSante(h.key)}
                >
                  {h.emoji}<span>{h.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Herbe */}
        <div className="fr full">
          <div className="fld">
            <label>Herbe au pied (toile tissée)</label>
            <div className="grow">
              {GRASS_DEFS.map(g => (
                <div
                  key={g.key}
                  className={`gchip${grass === g.key ? ' sel' : ''}`}
                  onClick={() => setGrass(g.key)}
                >
                  <GrassIcon gkey={g.key} size={42} />
                  <span className="glbl">{g.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="fr full">
          <div className="fld">
            <label>Notes / Observations</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observations…" />
          </div>
        </div>
      </div>

      {/* Historique */}
      {tree.history?.length > 0 && (
        <div className="hblock">
          <div className="hlbl">Historique ({tree.history.length})</div>
          {[...tree.history].reverse().map((h, i) => (
            <div key={i} className="hi">
              <div className="hid">{h.date}</div>
              <div className="hib">{h.sum}</div>
            </div>
          ))}
        </div>
      )}

      <div className="brow">
        <button className="bp" onClick={() => onSave({ name, hauteur, diametre, datePlantation: date, sante, grass, notes })}>
          💾 Enregistrer
        </button>
        <button className="bd" onClick={onDelete}>🗑 Supprimer cet arbre</button>
      </div>
    </Sheet>
  )
}
