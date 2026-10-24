import { useState, useRef } from 'react'
import { useData }        from './hooks/useData'
import { useToast }       from './hooks/useToast'
import { calcPxPerM }     from './utils/canvas'
import { uid, today, fmt, planRenumber, cellLabel, treeName } from './utils/helpers'
import { HEALTH_DEFS, GRASS_DEFS } from './utils/constants'
import { signIn, signOut } from './utils/cloud'

import PageChamp    from './components/PageChamp'
import PageListe    from './components/PageListe'
import PageJournal  from './components/PageJournal'
import PageMeteo    from './components/PageMeteo'

import TreeSheet    from './components/TreeSheet'
import GridSheet    from './components/GridSheet'
import ConfirmSheet from './components/ConfirmSheet'
import JournalSheet from './components/JournalSheet'
import MeteoSheet   from './components/MeteoSheet'
import SettingsSheet from './components/SettingsSheet'
import PlaceSheet   from './components/PlaceSheet'
import Toast        from './components/Toast'

const TABS = [
  { id: 'champ',   icon: '🗺️', label: 'Champ'   },
  { id: 'liste',   icon: '📋', label: 'Liste'   },
  { id: 'journal', icon: '📓', label: 'Journal' },
  { id: 'meteo',   icon: '🌦️', label: 'Météo'   },
]

export default function App() {
  const data = useData()
  const { msg: toastMsg, showToast } = useToast()

  const [tab,      setTab]      = useState('champ')
  const [selTree,  setSelTree]  = useState(null)
  const [selId,    setSelId]    = useState(null)
  const [gridOpen, setGridOpen] = useState(false)
  const [gridPrev, setGridPrev] = useState(null)
  const [confData, setConfData] = useState(null)
  const [confOpen, setConfOpen] = useState(false)
  const [jOpen,    setJOpen]    = useState(false)
  const [editJid,  setEditJid]  = useState(null)
  const [jCat,     setJCat]     = useState('')
  const [mOpen,    setMOpen]    = useState(false)
  const [setOpen,  setSetOpen]  = useState(false)
  const [placeFor, setPlaceFor] = useState(null)   // null = fermé · 'new' = ajout · arbre = déplacement

  /* ── Arbres ── */
  function handlePlace(cell) {
    const moving = placeFor !== 'new'
    const res = data.placeTree(cell.row, cell.col, moving ? placeFor.id : null)
    if (res.error) { showToast(`⛔ Place déjà occupée par ${treeName(res.other)}`); return }
    setPlaceFor(null)
    showToast(moving ? `📍 Déplacé en ${cellLabel(cell.row, cell.col)}` : `🌱 Arbre ajouté en ${cellLabel(cell.row, cell.col)}`)
    setSelId(res.tree.id); setSelTree(res.tree)   // ouvre sa fiche
  }
  function handleSelectTree(id) {
    setSelId(id)
    setSelTree(data.trees.find(t => t.id === id) || null)
  }
  function handleSaveTree(formData) {
    data.updateTree(selTree, formData)
    setSelTree(null); setSelId(null)
    showToast('✅ Enregistré')
  }
  function handleDeleteTree() {
    const id = selTree.id
    setSelTree(null); setSelId(null)
    setTimeout(() => {
      data.deleteTree(id)
      showToast('🗑 Arbre supprimé')
    }, 120)
  }

  /* ── Grille ── */
  function buildPos(cfg) {
    const pos = []
    for (let r = 0; r < cfg.rows; r++)
      for (let c = 0; c < cfg.cols; c++)
        pos.push({ xm: c * cfg.sx, ym: r * cfg.sy, row: r, col: c })
    return pos
  }
  function getOffsetX(sx) {
    if (!data.trees.length) return 0
    const maxX = Math.max(...data.trees.map(t => t.xm || 0))
    return Math.ceil(maxX / sx) * sx + sx
  }
  function handlePreviewGrid(cfg) {
    const offsetX = getOffsetX(cfg.sx)
    const pos = buildPos(cfg).map(p => ({ ...p, xm: p.xm + offsetX }))
    setGridPrev(pos)
    showToast(`Aperçu : ${pos.length} positions`)
  }
  function handlePlaceGrid(cfg) {
    const offsetX = getOffsetX(cfg.sx)
    const pos = buildPos(cfg).map(p => ({ ...p, xm: p.xm + offsetX }))
    setConfData({ cfg, pos, offsetX })
    setConfOpen(true)
    setGridOpen(false)
  }
  function handleDoPlace(replace) {
    const result = data.placeGrid({ ...confData, replace })
    setGridPrev(null); setConfOpen(false); setConfData(null)
    showToast(`✅ ${result.trees.length} arbres placés`)
  }

  /* ── Journal ── */
  function handleSaveJournal(formData) {
    if (!formData.tit && !formData.body) { showToast('⚠️ Titre ou contenu requis'); return }
    data.saveJournalEntry(formData, editJid)
    setJOpen(false); setEditJid(null)
    showToast('✅ Entrée enregistrée')
  }
  function handleDeleteJournal(id) {
    data.deleteJournalEntry(id)
    showToast('🗑 Entrée supprimée')
  }

  /* ── Météo ── */
  function handleSaveMeteo(formData) {
    data.saveMeteoEntry(formData)
    setMOpen(false)
    showToast('✅ Relevé enregistré')
  }

  /* ── Export/Import ── */
  function exportCSV() {
    const rows = [
      ['Label','Nom','Ligne','Colonne','Hauteur(cm)','Diamètre(cm)','DatePlantation','État santé','Herbe au pied','Notes'],
      ...data.trees.map(t => {
        const h = HEALTH_DEFS.find(x => x.key === t.sante)
        const g = GRASS_DEFS.find(x => x.key === t.grass)
        return [t._label||'', t.name, t.row!=null?t.row+1:'', t.col!=null?t.col+1:'',
                t.hauteur, t.diametre, t.datePlantation, h?h.label:'', g?g.label:'',
                (t.notes||'').replace(/\n/g,' ')]
      })
    ]
    const csv = rows.map(r => r.map(c => `"${c ?? ''}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `arbres-${today()}.csv`; a.click()
    showToast('📤 CSV exporté')
  }

  function exportJSON() {
    const payload = JSON.stringify({ trees: data.trees, journal: data.journal, meteo: data.meteo, fw: data.fw, fh: data.fh, exportDate: today(), version: 'v8' }, null, 2)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }))
    a.download = `mon-champ-backup-${today()}.json`; a.click()
    showToast('📦 JSON exporté')
  }

  function importJSON() {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = '.json'
    input.onchange = e => {
      const file = e.target.files[0]; if (!file) return
      const reader = new FileReader()
      reader.onload = ev => {
        try {
          const p = JSON.parse(ev.target.result)
          if (!p.trees && !p.journal && !p.meteo) { showToast('⚠️ JSON invalide'); return }
          if (!confirm(`Importer ${(p.trees||[]).length} arbre(s) ?\nCela remplacera toutes les données.`)) return
          const n = data.importAll(p)
          setSetOpen(false); showToast(`✅ ${n} arbre(s) importé(s)`)
        } catch { showToast('⚠️ Erreur JSON') }
      }
      reader.readAsText(file)
    }
    input.click()
  }

    /* ── Cloud ── */
  async function handleSignIn() {
    try { await signIn() } catch (e) { showToast('⚠️ Connexion impossible : ' + (e?.code || 'erreur')) }
  }
  async function handleSignOut() {
    await signOut(); showToast('Déconnecté (les données restent sur ce téléphone)')
  }
  function handleCopyUid() {
    navigator.clipboard?.writeText(data.cloud.user?.uid || '').then(() => showToast('📋 Identifiant copié'))
  }

  function handleRenumber() {
    const { assign, changes, skipped } = planRenumber(data.trees)
    const line = t => `${treeName(t)} (x ${Math.round(t.xm)} m, y ${Math.round(t.ym)} m)`
    const cut = (arr, f) => arr.slice(0, 12).map(f).join('\n') + (arr.length > 12 ? `\n… et ${arr.length - 12} autre(s)` : '')
    if (!assign.length) {
      alert('Tous les arbres ont déjà le bon numéro.' + (skipped.length ? `\n\nNon traités :\n${cut(skipped, s => `• ${line(s.tree)} : ${s.reason}`)}` : ''))
      return
    }
    const msg = (changes.length
        ? `${changes.length} numéro(s) vont changer :\n${cut(changes, c => `• ${c.from} → ${c.to}  (x ${Math.round(c.tree.xm)} m, y ${Math.round(c.tree.ym)} m)`)}`
        : 'Aucun numéro ne change, seules les positions sont recalées sur la grille.')
      + (skipped.length ? `\n\n${skipped.length} arbre(s) non traités :\n${cut(skipped, s => `• ${line(s.tree)} : ${s.reason}`)}` : '')
      + '\n\nContinuer ?'
    if (!confirm(msg)) return
    data.applyCells(assign)
    setSetOpen(false)
    showToast(`✅ ${changes.length} renuméroté(s)` + (skipped.length ? ` · ${skipped.length} non traités` : ''))
  }


  function clearAll() {
    const where = data.cloud.user ? ' (sur ce téléphone ET dans le cloud)' : ''
    if (!confirm(`Supprimer TOUTES les données${where} ?`)) return
    data.clearAll(); setSetOpen(false); showToast('Données effacées')
  }

  return (
    <div className="app">
      {/* Header */}
      <div className="hdr">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1>🌿 Paulownia App</h1>
          <span className="hdr-sub">
            {data.trees.length} arbre{data.trees.length !== 1 ? 's' : ''}
            {data.cloud.status === 'synced' && ' · ☁️'}
            {data.cloud.status === 'pending' && ' · ⏳'}
            {(data.cloud.status === 'denied' || data.cloud.status === 'error') && ' · ⚠️'}
          </span>
        </div>
        <button className="hdr-btn" onClick={() => setSetOpen(true)}>⚙️ Réglages</button>
      </div>

      {/* Pages */}
      <div className="pages">
        <PageChamp
          trees={data.trees} fw={data.fw} fh={data.fh}
          active={tab === 'champ'}
          selId={selId}
          gridPrev={gridPrev}
          onAddTree={() => setPlaceFor('new')}
          onSelectTree={handleSelectTree}
          onOpenGrid={() => setGridOpen(true)}
        />
        <PageListe
          trees={data.trees} active={tab === 'liste'}
          onGotoTree={id => { setTab('champ'); setTimeout(() => handleSelectTree(id), 80) }}
        />
        <PageJournal
          journal={data.journal} active={tab === 'journal'}
          onAdd={cat => { setEditJid(null); setJCat(cat || ''); setJOpen(true) }}          
          onEdit={id => { setEditJid(id); setJOpen(true) }}
          onDelete={handleDeleteJournal}
        />
        <PageMeteo
          meteo={data.meteo} active={tab === 'meteo'}
          onAdd={() => setMOpen(true)}
          onDelete={id => { data.deleteMeteoEntry(id); showToast('🗑 Relevé supprimé') }}
        />
      </div>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map(t => (
          <button key={t.id} className={`tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
            <span className="ti">{t.icon}</span>
            <span className="tl">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Modals */}
      <TreeSheet
        tree={selTree}
        onClose={() => { setSelTree(null); setSelId(null) }}
        onSave={handleSaveTree}
        onDelete={handleDeleteTree}
        onMove={() => { const t = selTree; setSelTree(null); setSelId(null); setPlaceFor(t) }}
      />
      <PlaceSheet
        open={!!placeFor}
        tree={placeFor && placeFor !== 'new' ? placeFor : null}
        trees={data.trees}
        onClose={() => setPlaceFor(null)}
        onConfirm={handlePlace}
      />
      <GridSheet
        open={gridOpen}
        onClose={() => { setGridOpen(false); setGridPrev(null) }}
        onPreview={handlePreviewGrid}
        onPlace={handlePlaceGrid}
      />
      <ConfirmSheet
        open={confOpen}
        onClose={() => setConfOpen(false)}
        confData={confData}
        treeCount={data.trees.length}
        onPlace={handleDoPlace}
      />
      <JournalSheet
        open={jOpen}
        editEntry={editJid ? data.journal.find(e => e.id === editJid) : null}
        defaultCat={jCat}
        cats={[...new Set(data.journal.map(e => (e.cat || '').trim()).filter(Boolean))]}
        onClose={() => { setJOpen(false); setEditJid(null) }}
        onSave={handleSaveJournal}
      />
      <MeteoSheet open={mOpen} onClose={() => setMOpen(false)} onSave={handleSaveMeteo} />
      <SettingsSheet
        open={setOpen}
        onClose={() => setSetOpen(false)}
        cloud={data.cloud}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onCopyUid={handleCopyUid}
        onExportCSV={exportCSV}
        onExportJSON={exportJSON}
        onImportJSON={importJSON}
        onClearAll={clearAll}
        onSnapGrid={handleRenumber}
      />

      <Toast msg={toastMsg} />
    </div>
  )
}
