import Sheet from './Sheet'

const label = { fontSize: 10, fontWeight: 700, color: 'var(--barkl)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }
const text  = { fontSize: 12, color: 'var(--bark)', lineHeight: 1.6, marginBottom: 12 }

const STATUS = {
  connecting: '🔄 Connexion au cloud…',
  synced:     '✅ Données synchronisées',
  pending:    '⏳ Envoi en cours…',
  offline:    '📴 Hors-ligne : les modifications partiront au retour du réseau',
  denied:     '⛔ Accès refusé par les règles Firestore',
  error:      '⚠️ Erreur de synchronisation',
}

function CloudSection({ cloud, onSignIn, onSignOut, onCopyUid }) {
  if (cloud.status === 'disabled') return null
  return (
    <div style={{ paddingBottom: 14, marginBottom: 14, borderBottom: '1px solid var(--sand)' }}>
      <p style={label}>Synchronisation cloud</p>
      {!cloud.user ? (
        <>
          <p style={text}>Connectez-vous pour sauvegarder vos données en ligne et les retrouver sur un autre téléphone.</p>
          <button className="bp" style={{ width: '100%', padding: '11px 8px', fontSize: 13 }} onClick={onSignIn}>
            🔐 Se connecter avec Google
          </button>
        </>
      ) : (
        <>
          <p style={{ ...text, marginBottom: 4 }}>Connecté : <b>{cloud.user.email}</b></p>
          <p style={text}>{STATUS[cloud.status] || ''}</p>
          {(cloud.status === 'denied' || cloud.status === 'error') && (
            <p style={{ ...text, fontSize: 11 }}>
              Identifiant du compte (à mettre dans les règles Firestore) :<br />
              <code style={{ wordBreak: 'break-all' }}>{cloud.user.uid}</code>{' '}
              <button className="bs" style={{ padding: '2px 8px', fontSize: 11 }} onClick={onCopyUid}>Copier</button>
            </p>
          )}
          <button className="bs" style={{ width: '100%', padding: '9px 8px', fontSize: 12 }} onClick={onSignOut}>
            Se déconnecter
          </button>
        </>
      )}
    </div>
  )
}

export default function SettingsSheet({ open, onClose, cloud, onSignIn, onSignOut, onCopyUid, onExportCSV, onExportJSON, onImportJSON, onClearAll }) {
  return (
    <Sheet open={open} onClose={onClose} title="⚙️ Réglages">
      <div className="fb">
        <CloudSection cloud={cloud} onSignIn={onSignIn} onSignOut={onSignOut} onCopyUid={onCopyUid} />
        <div style={{ paddingBottom: 14, borderBottom: '1px solid var(--sand)' }}>
          <p style={label}>Sauvegarde des données</p>
          <p style={text}>Gardez de temps en temps un export JSON comme copie de secours.</p>
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