import Sheet from './Sheet'

export default function ConfirmSheet({ open, onClose, confData, treeCount, onPlace }) {
  if (!confData) return null
  const { cfg, pos } = confData

  return (
    <Sheet open={open} onClose={onClose} title="Placer les arbres">
      <div className="cbody">
        <div className="cico">🌳</div>
        <div className="ctit">Placer {pos.length} arbres</div>
        <div className="ctxt">
          {treeCount > 0
            ? <span>Vous avez déjà <strong>{treeCount} arbre{treeCount > 1 ? 's' : ''}</strong>.<br />➕ Ajouter ou remplacer ?</span>
            : <span>{pos.length} arbres · {cfg.rows} lignes × {cfg.cols} colonnes</span>
          }
        </div>
      </div>
      <div className="cbtns">
        <button className="bp" onClick={() => onPlace(false)}>➕ Ajouter aux arbres existants</button>
        {treeCount > 0 && <button className="bd" onClick={() => onPlace(true)}>🗑 Remplacer tous les arbres</button>}
        <button className="bs" onClick={onClose}>Annuler</button>
      </div>
    </Sheet>
  )
}
