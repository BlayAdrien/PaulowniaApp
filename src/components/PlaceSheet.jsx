import { useState, useEffect } from 'react'
import Sheet from './Sheet'
import { parseCell, cellLabel, treeName } from '../utils/helpers'

/* Saisie d'une case "L19C9" pour ajouter un arbre ou déplacer celui passé en `tree` */
export default function PlaceSheet({ open, tree, trees, onClose, onConfirm }) {
  const [txt, setTxt] = useState('')
  const moving = !!tree

  useEffect(() => {
    if (open) setTxt(moving && tree.row != null ? cellLabel(tree.row, tree.col) : '')
  }, [open, tree, moving])

  const cell  = parseCell(txt)
  const other = cell && trees.find(t => t.row === cell.row && t.col === cell.col && t.id !== tree?.id)
  const same  = cell && moving && tree.row === cell.row && tree.col === cell.col
  const left  = cell && cell.col > 0 && trees.find(t => t.row === cell.row && t.col === cell.col - 1)

  let msg = null
  if (txt.trim() && !cell) msg = { ok: false, text: 'Format attendu : L19C9 (ligne 19, colonne 9)' }
  else if (other)          msg = { ok: false, text: `Place déjà occupée par ${treeName(other)}` }
  else if (same)           msg = { ok: false, text: 'L\'arbre est déjà sur cette case' }
  else if (cell)           msg = { ok: true,  text: `Case libre${left ? ` · à droite de ${treeName(left)}` : ''}` }

  const canGo = cell && !other && !same

  return (
    <Sheet open={open} onClose={onClose} title={moving ? `📍 Déplacer ${treeName(tree)}` : '🌱 Ajouter un arbre'}>
      <div className="fb">
        <div className="fr full">
          <div className="fld">
            <label>Case (ligne et colonne)</label>
            <input
              value={txt} onChange={e => setTxt(e.target.value.toUpperCase())}
              placeholder="ex : L19C9" autoCapitalize="characters" autoComplete="off"
              onKeyDown={e => { if (e.key === 'Enter' && canGo) onConfirm(cell) }}
              style={{ fontSize: 18, fontWeight: 700, letterSpacing: '.05em' }}
            />
          </div>
        </div>
        {msg && (
          <div style={{ fontSize: 13, fontWeight: 600, padding: '4px 2px', color: msg.ok ? 'var(--moss)' : 'var(--red)' }}>
            {msg.ok ? '✅ ' : '⛔ '}{msg.text}
          </div>
        )}
      </div>
      <div className="brow">
        <button className="bp" disabled={!canGo} style={{ opacity: canGo ? 1 : .45 }} onClick={() => canGo && onConfirm(cell)}>
          {moving ? '📍 Déplacer ici' : '🌱 Ajouter'}
        </button>
      </div>
    </Sheet>
  )
}
