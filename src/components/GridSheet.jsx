import { useState } from 'react'
import Sheet from './Sheet'

export default function GridSheet({ open, onClose, onPreview, onPlace }) {
  const [fw, setFw] = useState(50)
  const [fh, setFh] = useState(40)
  const [sx, setSx] = useState(5)
  const [sy, setSy] = useState(5)

  const cols  = Math.max(1, Math.floor(fw / sx) + 1)
  const rows  = Math.max(1, Math.floor(fh / sy) + 1)
  const total = rows * cols

  const cfg = { fw, fh, sx, sy, cols, rows }

  return (
    <Sheet open={open} onClose={onClose} title="⊞ Grille automatique">
      <div className="fb">
        <div className="fr">
          <div className="fld">
            <label>Largeur champ (m)</label>
            <input type="number" value={fw} onChange={e => setFw(parseFloat(e.target.value) || 50)} min="1" inputMode="decimal" />
          </div>
          <div className="fld">
            <label>Profondeur (m)</label>
            <input type="number" value={fh} onChange={e => setFh(parseFloat(e.target.value) || 40)} min="1" inputMode="decimal" />
          </div>
        </div>
        <div className="fr">
          <div className="fld">
            <label>Espacement X (m)</label>
            <input type="number" value={sx} onChange={e => setSx(parseFloat(e.target.value) || 5)} min="0.5" step="0.5" inputMode="decimal" />
          </div>
          <div className="fld">
            <label>Espacement Y (m)</label>
            <input type="number" value={sy} onChange={e => setSy(parseFloat(e.target.value) || 5)} min="0.5" step="0.5" inputMode="decimal" />
          </div>
        </div>
      </div>

      <div className="rcard">
        <div className="rico">🌲</div>
        <div>
          <div className="rcnt">{total} arbres</div>
          <div className="rdet">{rows} lignes × {cols} colonnes<br />{fw}m × {fh}m · esp. {sx}m/{sy}m</div>
        </div>
      </div>

      <div className="brow" style={{ marginTop: 13 }}>
        <button className="bs" onClick={() => onPreview(cfg)}>👁 Aperçu</button>
        <button className="bp" onClick={() => onPlace(cfg)}>✅ Placer</button>
      </div>
      <div style={{ height: 4 }} />
    </Sheet>
  )
}
