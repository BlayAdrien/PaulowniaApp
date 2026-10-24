import { useRef, useEffect, useState, useCallback } from 'react'
import { renderCanvas, calcPxPerM, m2c, treeRadius } from '../utils/canvas'
import { HEALTH_DEFS, MARGIN, TARGET_PX } from '../utils/constants'
import { parseCell, cellLabel } from '../utils/helpers'

const MAX_ZOOM = 8

export default function PageChamp({ trees, fw, fh, active, onAddTree, onSelectTree, onOpenGrid, onToast, gridPrev, selId }) {
  const canvasRef = useRef(null)
  const stateRef  = useRef({ zoom: 1, panX: 0, panY: 0, ppm: 18, fitted: false })
  const interRef  = useRef({ moved: false, panS: null, pinchS: null, mdown: false, mmoved: false, lastTap: null, tapTimer: null })
  const [zoom, setZoom]     = useState(1)
  const [hiId, setHiId]     = useState(null)   // arbre mis en surbrillance par « Aller à »
  const [goTxt, setGoTxt]   = useState('')
  const [legend, setLegend] = useState(true)

  /* Étendue réelle du champ (mètres) */
  const extent = () => ({
    w: Math.max(fw, ...trees.map(t => t.xm || 0), 1),
    h: Math.max(fh, ...trees.map(t => t.ym || 0), 1),
  })
  const wrapSize = () => {
    const w = canvasRef.current?.parentElement
    return { W: w?.clientWidth || 0, H: w?.clientHeight || 0 }
  }
  /* Zoom pour que toute la largeur tienne à l'écran, et zoom minimum (tout le champ visible) */
  function fitZooms() {
    const s = stateRef.current, { W, H } = wrapSize(), e = extent()
    const fitW = (W - 2 * MARGIN) / (e.w * s.ppm)
    const fitAll = Math.min(fitW, (H - 2 * MARGIN) / (e.h * s.ppm))
    return { fitW, minZ: Math.min(fitAll * 0.9, fitW) }
  }
  const clampZ = z => Math.min(MAX_ZOOM, Math.max(fitZooms().minZ, z))

  const doRender = useCallback(() => {
    const s = stateRef.current
    renderCanvas({
      canvas: canvasRef.current, trees, fw, fh,
      panX: s.panX, panY: s.panY, ppm: s.ppm, zoom: s.zoom,
      selId, hiId, gridPrev,
    })
  }, [trees, fw, fh, selId, hiId, gridPrev])

  /* Vue « largeur » : les colonnes remplissent l'écran, on part du haut du champ */
  function fitWidth() {
    const s = stateRef.current
    s.ppm = calcPxPerM(trees)
    const { fitW } = fitZooms()
    s.zoom = fitW; s.panX = 0; s.panY = 0
    setZoom(s.zoom); doRender()
  }

  // Première ouverture de la page (quand la carte a une taille) → vue largeur
  useEffect(() => {
    const s = stateRef.current
    if (active && !s.fitted && wrapSize().W > 0) { s.fitted = true; fitWidth() }
    else doRender()
  }, [active, trees, fw, fh, doRender])

  useEffect(() => {
    window.addEventListener('resize', doRender)
    return () => window.removeEventListener('resize', doRender)
  }, [doRender])

  /* Zoom en gardant le point (cx, cy) de l'écran immobile */
  function zoomAt(cx, cy, nz) {
    const s = stateRef.current
    nz = clampZ(nz)
    s.panX = cx - MARGIN - (cx - s.panX - MARGIN) * (nz / s.zoom)
    s.panY = cy - MARGIN - (cy - s.panY - MARGIN) * (nz / s.zoom)
    s.zoom = nz; setZoom(nz); doRender()
  }

  /* L'arbre le plus proche du doigt, s'il est dans sa case (± un demi-espacement) */
  function hitTree(cx, cy) {
    const s = stateRef.current
    const reach = Math.max(22, TARGET_PX * s.zoom * 0.5)
    let best = null, bd = reach
    trees.forEach(t => {
      const p = m2c(t.xm, t.ym, s.panX, s.panY, s.ppm, s.zoom)
      const r = treeRadius(t.hauteur, s.zoom)
      // on vise le milieu du dessin (la couronne est au-dessus du pied)
      const d = Math.hypot(p.cx - cx, p.cy - r * 0.8 - cy)
      if (d < bd) { bd = d; best = t }
    })
    return best
  }

  /* Toucher simple → ouvre l'arbre (après un court délai) ; double toucher → zoom ×2 */
  function handleTap(cx, cy) {
    const ir = interRef.current, now = Date.now()
    if (ir.lastTap && now - ir.lastTap.t < 300 && Math.hypot(cx - ir.lastTap.x, cy - ir.lastTap.y) < 30) {
      clearTimeout(ir.tapTimer); ir.lastTap = null
      zoomAt(cx, cy, stateRef.current.zoom * 2)
      return
    }
    ir.lastTap = { t: now, x: cx, y: cy }
    clearTimeout(ir.tapTimer)
    ir.tapTimer = setTimeout(() => {
      ir.lastTap = null
      const hit = hitTree(cx, cy)
      if (hit) onSelectTree(hit.id)
    }, 260)
  }

  function getXY(ev, idx = 0) {
    const rect = canvasRef.current.parentElement.getBoundingClientRect()
    const src  = ev.touches ? ev.touches[idx] : (ev.changedTouches ? ev.changedTouches[0] : ev)
    return { cx: src.clientX - rect.left, cy: src.clientY - rect.top }
  }
  function getEndXY(ev) {
    const rect = canvasRef.current.parentElement.getBoundingClientRect()
    const src  = ev.changedTouches ? ev.changedTouches[0] : ev
    return { cx: src.clientX - rect.left, cy: src.clientY - rect.top }
  }

  function onTouchStart(e) {
    e.preventDefault()
    const s = stateRef.current, ir = interRef.current
    ir.moved = false
    if (e.touches.length === 2) {
      ir.panS = null
      const rect = canvasRef.current.parentElement.getBoundingClientRect()
      const a = e.touches[0], b = e.touches[1]
      ir.pinchS = {
        dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
        zoom0: s.zoom, panX0: s.panX, panY0: s.panY,
        midX: (a.clientX + b.clientX) / 2 - rect.left, midY: (a.clientY + b.clientY) / 2 - rect.top,
      }
      return
    }
    ir.pinchS = null
    const { cx, cy } = getXY(e)
    ir.panS = { x: cx, y: cy, panX0: s.panX, panY0: s.panY }
  }

  function onTouchMove(e) {
    e.preventDefault()
    const s = stateRef.current, ir = interRef.current
    ir.moved = true
    if (e.touches.length === 2 && ir.pinchS) {
      const p = ir.pinchS, rect = canvasRef.current.parentElement.getBoundingClientRect()
      const a = e.touches[0], b = e.touches[1]
      const nz = clampZ(p.zoom0 * Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) / p.dist)
      const mx = (a.clientX + b.clientX) / 2 - rect.left, my = (a.clientY + b.clientY) / 2 - rect.top
      // le point sous les doigts au départ suit les doigts
      s.panX = mx - MARGIN - (p.midX - p.panX0 - MARGIN) * (nz / p.zoom0)
      s.panY = my - MARGIN - (p.midY - p.panY0 - MARGIN) * (nz / p.zoom0)
      s.zoom = nz; setZoom(nz); doRender(); return
    }
    if (e.touches.length !== 1) return
    const { cx, cy } = getXY(e)
    if (ir.panS) {
      // un petit tremblement du doigt compte encore comme un simple toucher
      if (!ir.panS.passed && Math.hypot(cx - ir.panS.x, cy - ir.panS.y) < 6) { ir.moved = false; return }
      ir.panS.passed = true
      s.panX = ir.panS.panX0 + (cx - ir.panS.x)
      s.panY = ir.panS.panY0 + (cy - ir.panS.y)
      doRender()
    }
  }

  function onTouchEnd(e) {
    e.preventDefault()
    const ir = interRef.current
    if (ir.pinchS && e.touches.length < 2) { ir.pinchS = null; ir.moved = true; return }
    ir.panS = null
    if (!ir.moved && e.touches.length === 0) { const { cx, cy } = getEndXY(e); handleTap(cx, cy) }
  }

  function onMouseDown(e) {
    const ir = interRef.current, s = stateRef.current
    ir.mdown = true; ir.mmoved = false
    const { cx, cy } = getXY(e)
    ir.panS = { x: cx, y: cy, panX0: s.panX, panY0: s.panY }
  }
  function onMouseMove(e) {
    const ir = interRef.current, s = stateRef.current
    if (!ir.mdown || !ir.panS) return
    const { cx, cy } = getXY(e)
    if (!ir.mmoved && Math.hypot(cx - ir.panS.x, cy - ir.panS.y) < 4) return
    ir.mmoved = true
    s.panX = ir.panS.panX0 + (cx - ir.panS.x); s.panY = ir.panS.panY0 + (cy - ir.panS.y); doRender()
  }
  function onMouseUp(e) {
    const ir = interRef.current
    ir.mdown = false; ir.panS = null
    if (!ir.mmoved) { const { cx, cy } = getEndXY(e); handleTap(cx, cy) }
  }
  function onWheel(e) {
    e.preventDefault()
    const { cx, cy } = getXY(e)
    zoomAt(cx, cy, stateRef.current.zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15))
  }

  function zoomCenter(f) { const { W, H } = wrapSize(); zoomAt(W / 2, H / 2, stateRef.current.zoom * f) }

  /* « Aller à » une case : centre l'arbre, zoome dessus et le met en surbrillance */
  function goTo() {
    const cell = parseCell(goTxt)
    if (!cell) { onToast?.('Format attendu : L19C7'); return }
    const t = trees.find(x => x.row === cell.row && x.col === cell.col)
    if (!t) { onToast?.(`Aucun arbre en ${cellLabel(cell.row, cell.col)}`); return }
    const s = stateRef.current, { W, H } = wrapSize()
    s.zoom = clampZ(Math.max(s.zoom, 120 / TARGET_PX))   // arbres bien visibles
    s.panX = W / 2 - MARGIN - t.xm * s.ppm * s.zoom
    s.panY = H / 2 - MARGIN - t.ym * s.ppm * s.zoom
    setZoom(s.zoom); setHiId(t.id)
    document.activeElement?.blur?.()   // ferme le clavier
    setTimeout(() => setHiId(h => (h === t.id ? null : h)), 4000)
  }

  useEffect(() => { doRender() }, [hiId, doRender])

  return (
    <>
      <div id="page-champ" className={`page${active ? ' active' : ''}`}>
        <div className="modebar">
          <form style={{ flex: 1, display: 'flex', gap: 6, minWidth: 0 }} onSubmit={e => { e.preventDefault(); goTo() }}>
            <input
              value={goTxt} onChange={e => setGoTxt(e.target.value.toUpperCase())}
              placeholder="Aller à… L19C7" autoCapitalize="characters" autoComplete="off" enterKeyHint="go"
              style={{ flex: 1, minWidth: 0, padding: '6px 10px', border: '1.5px solid var(--sand)', borderRadius: 10, fontSize: 13, fontWeight: 600, background: '#fff', color: 'var(--ink)' }}
            />
            <button type="submit" className="mode-toggle view" style={{ padding: '6px 10px' }}>🔍</button>
          </form>
          <button className="mode-toggle edit" onClick={onAddTree}>🌱 Ajouter</button>
        </div>

        <div id="cwrap">
          <canvas ref={canvasRef} id="fc"
            onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}
            onWheel={onWheel}
          />
          <div className="legend" onClick={() => setLegend(l => !l)} style={{ cursor: 'pointer' }}>
            {legend ? (
              <>
                {HEALTH_DEFS.map(h => (
                  <div key={h.key} className="lr">
                    <div className="ld" style={{ background: h.crown }} />
                    {h.label}
                  </div>
                ))}
                <div className="lr" style={{ marginTop: 4, borderTop: '1px solid rgba(92,61,30,.15)', paddingTop: 4 }}>
                  <svg width="11" height="11" style={{ flexShrink: 0 }}>
                    <circle cx="5.5" cy="5.5" r="5" fill="#111" />
                    <circle cx="5.5" cy="5.5" r="2.5" fill="#38a022" />
                  </svg>
                  Herbe
                </div>
              </>
            ) : <div className="lr">ⓘ Légende</div>}
          </div>
        </div>
      </div>

      {active && (
        <>
          <div className="zctrl">
            <button className="zb" onClick={() => zoomCenter(1.35)}>＋</button>
            <div className="zlbl">{Math.round(zoom * 100)}%</div>
            <button className="zb" onClick={() => zoomCenter(1 / 1.35)}>－</button>
            <button className="zb" onClick={fitWidth}>⊙</button>
          </div>
          <button className="fab" onClick={onOpenGrid}>⊞</button>
        </>
      )}
    </>
  )
}
