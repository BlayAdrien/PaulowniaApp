import Sheet from './Sheet'

export default function SettingsSheet({ open, onClose, onExportCSV, onExportJSON, onImportJSON, onClearAll }) {
  return (
    <Sheet open={open} onClose={onClose} title="⚙️ Réglages">
      <div className="fb">
        <div style={{ paddingBottom: 14, borderBottom: '1px solid var(--sand)' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--barkl)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>
            Sauvegarde des données
          </p>
          <p style={{ fontSize: 12, color: 'var(--bark)', lineHeight: 1.6, marginBottom: 12 }}>
            Exportez vos données avant une mise à jour, puis réimportez-les après.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="bp" style={{ flex: 1, padding: '11px 8px', fontSize: 13 }} onClick={onExportJSON}>📦 Exporter JSON</button>
            <button className="bs" style={{ flex: 1, padding: '11px 8px', fontSize: 13 }} onClick={onImportJSON}>📥 Importer JSON</button>
          </div>
        </div>
      </div>
      <div className="brow">
        <button className="bd" onClick={onExportCSV}>📊 Exporter CSV arbres</button>
        <button className="bs" onClick={onClearAll}>⚠️ Réinitialiser toutes les données</button>
      </div>
    </Sheet>
  )
}
