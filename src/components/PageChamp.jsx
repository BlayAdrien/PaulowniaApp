import { useRef, useEffect, useState, useCallback } from 'react'
import { renderCanvas, calcPxPerM, m2c, c2m, treeRadius } from '../utils/canvas'
import { HEALTH_DEFS, MARGIN } from '../utils/constants'

const INIT_PPM = 18

export default function PageChamp({ trees, fw, fh, active, onAddTree, onSelectTree, onMoveTree, onOpenGrid, gridPrev, selId }) {
  const canvasRef = useRef(null)
  const stateRef  = useRef({ zoom: 1, panX: 0, panY: 0, ppm: INIT_PPM, viewOnly: false })
  const interRef  = useRef({ moved: false, dragT: null, panS: null, pinchS: null, mdown: false, mmoved: false })
  const [zoom, setZoom] = useState(1)
  const [viewOnly, setViewOnly] = useState(false)

  const doRender = useCallback(() => {
    const s = stateRef.current
    renderCanvas({
      canvas: canvasRef.current,
      trees, fw, fh,
      panX: s.panX, panY: s.panY, ppm: s.ppm, zoom: s.zoom,
      selId, gridPrev,
    })
  }, [trees, fw, fh, selId, gridPrev])

  // Recalcul pxPerM quand les arbres changent
  useEffect(() => {
    stateRef.current.ppm = calcPxPerM(trees)
    doRender()
  }, [trees, fw, fh, doRender])

  useEffect(() => {
    window.addEventListener('resize', doRender)
    return () => window.removeEventListener('resize', doRender)
  }, [doRender])

  // Re-render quand selId ou gridPrev change
  useEffect(() => { doRender() }, [selId, gridPrev, doRender])

  function hitTree(cx, cy) {
    const s = stateRef.current
    for (let i = trees.length - 1; i >= 0; i--) {
      const t = trees[i]
      const { cx: tx, cy: ty } = m2c(t.xm, t.ym, s.panX, s.panY, s.ppm, s.zoom)
      const r   = treeRadius(t.hauteur, s.zoom)
      const th  = r * 0.60, cry = r * 0.85
      const crY = ty - th - cry * 0.55
      const dx  = cx - tx, dy = cy - crY
      if ((dx * dx) / ((r * 1.1) ** 2) + (dy * dy) / (((th + cry) * 0.9) ** 2) <= 1) return t
    }
    return null
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
      ir.dragT = null; ir.panS = null
      const a = e.touches[0], b = e.touches[1]
      ir.pinchS = {
        dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
        zoom0: s.zoom, panX0: s.panX, panY0: s.panY,
        midX: (a.clientX + b.clientX) / 2, midY: (a.clientY + b.clientY) / 2,
      }
      return
    }
    ir.pinchS = null
    const { cx, cy } = getXY(e)
    const hit = hitTree(cx, cy)
    if (hit && !s.viewOnly) { ir.dragT = { id: hit.id, startXm: hit.xm, startYm: hit.ym, startCX: cx, startCY: cy }; ir.panS = null }
    else { ir.panS = { x: cx, y: cy, panX0: s.panX, panY0: s.panY }; ir.dragT = null }
  }

  function onTouchMove(e) {
    e.preventDefault()
    const s = stateRef.current, ir = interRef.current
    ir.moved = true
    if (e.touches.length === 2 && ir.pinchS) {
      const a = e.touches[0], b = e.touches[1]
      const dist  = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
      const scale = dist / ir.pinchS.dist
      const newZ  = Math.min(8, Math.max(0.2, ir.pinchS.zoom0 * scale))
      const rect  = canvasRef.current.parentElement.getBoundingClientRect()
      const mx = (a.clientX + b.clientX) / 2, my = (a.clientY + b.clientY) / 2
      s.panX = ir.pinchS.panX0 + (mx - rect.left - ir.pinchS.midX) + (ir.pinchS.midX - rect.left - MARGIN) * (1 - scale)
      s.panY = ir.pinchS.panY0 + (my - rect.top  - ir.pinchS.midY) + (ir.pinchS.midY - rect.top  - MARGIN) * (1 - scale)
      s.zoom = newZ; setZoom(newZ); doRender(); return
    }
    if (e.touches.length !== 1) return
    const { cx, cy } = getXY(e)
    if (ir.dragT) {
      onMoveTree(ir.dragT.id,
        ir.dragT.startXm + (cx - ir.dragT.startCX) / (s.ppm * s.zoom),
        ir.dragT.startYm + (cy - ir.dragT.startCY) / (s.ppm * s.zoom)
      )
    } else if (ir.panS) {
      s.panX = ir.panS.panX0 + (cx - ir.panS.x)
      s.panY = ir.panS.panY0 + (cy - ir.panS.y)
      doRender()
    }
  }

  function onTouchEnd(e) {
    e.preventDefault()
    const s = stateRef.current, ir = interRef.current
    if (ir.pinchS && e.touches.length < 2) { ir.pinchS = null; return }
    if (ir.dragT) { ir.dragT = null; return }
    ir.panS = null
    if (!ir.moved) {
      const { cx, cy } = getEndXY(e)
      const hit = hitTree(cx, cy)
      if (hit) onSelectTree(hit.id)
      else if (!s.viewOnly) {
        const { xm, ym } = c2m(cx, cy, s.panX, s.panY, s.ppm, s.zoom)
        if (xm >= 0 && xm <= fw && ym >= 0 && ym <= fh) onAddTree(xm, ym)
      }
    }
  }

  function onMouseDown(e) {
    const ir = interRef.current, s = stateRef.current
    ir.mdown = true; ir.mmoved = false
    const { cx, cy } = getXY(e), hit = hitTree(cx, cy)
    if (hit && !s.viewOnly) ir.dragT = { id: hit.id, startXm: hit.xm, startYm: hit.ym, startCX: cx, startCY: cy }
    else ir.panS = { x: cx, y: cy, panX0: s.panX, panY0: s.panY }
  }
  function onMouseMove(e) {
    const ir = interRef.current, s = stateRef.current
    if (!ir.mdown) return; ir.mmoved = true
    const { cx, cy } = getXY(e)
    if (ir.dragT) onMoveTree(ir.dragT.id, ir.dragT.startXm + (cx - ir.dragT.startCX) / (s.ppm * s.zoom), ir.dragT.startYm + (cy - ir.dragT.startCY) / (s.ppm * s.zoom))
    else if (ir.panS) { s.panX = ir.panS.panX0 + (cx - ir.panS.x); s.panY = ir.panS.panY0 + (cy - ir.panS.y); doRender() }
  }
  function onMouseUp(e) {
    const ir = interRef.current, s = stateRef.current
    ir.mdown = false
    if (ir.dragT) { ir.dragT = null; return }
    ir.panS = null
    if (!ir.mmoved) {
      const { cx, cy } = getEndXY(e), hit = hitTree(cx, cy)
      if (hit) onSelectTree(hit.id)
      else if (!s.viewOnly) {
        const { xm, ym } = c2m(cx, cy, s.panX, s.panY, s.ppm, s.zoom)
        if (xm >= 0 && xm <= fw && ym >= 0 && ym <= fh) onAddTree(xm, ym)
      }
    }
  }
  function onWheel(e) {
    e.preventDefault()
    const s = stateRef.current, { cx, cy } = getXY(e)
    const f  = e.deltaY < 0 ? 1.15 : 1 / 1.15
    const nz = Math.min(8, Math.max(0.2, s.zoom * f))
    s.panX = cx - (cx - s.panX) * (nz / s.zoom)
    s.panY = cy - (cy - s.panY) * (nz / s.zoom)
    s.zoom = nz; setZoom(nz); doRender()
  }

  function zIn()    { const s = stateRef.current; s.zoom = Math.min(8, s.zoom * 1.35); setZoom(s.zoom); doRender() }
  function zOut()   { const s = stateRef.current; s.zoom = Math.max(0.05, s.zoom / 1.35); setZoom(s.zoom); doRender() }
  function zReset() { const s = stateRef.current; s.ppm = calcPxPerM(trees); s.zoom = 1; s.panX = 0; s.panY = 0; setZoom(1); doRender() }
  function toggleVO() { stateRef.current.viewOnly = !stateRef.current.viewOnly; setViewOnly(v => !v) }

  return (
    <>
      <div id="page-champ" className={`page${active ? ' active' : ''}`}>
        <div className="modebar">
          <span className="mode-hint">
            {viewOnly ? 'Défilez et zoomez librement' : 'Touchez pour ajouter · Glissez pour déplacer'}
          </span>
          <button className={`mode-toggle${viewOnly ? ' edit' : ' view'}`} onClick={toggleVO}>
            {viewOnly ? '✏️ Mode édition' : '👁 Voir seulement'}
          </button>
        </div>

        <div id="cwrap">
          <canvas ref={canvasRef} id="fc"
            onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}
            onWheel={onWheel}
          />
          <div className="legend">
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
          </div>
        </div>
      </div>

      {active && (
        <>
          <div className="zctrl">
            <button className="zb" onClick={zIn}>＋</button>
            <div className="zlbl">{Math.round(zoom * 100)}%</div>
            <button className="zb" onClick={zOut}>－</button>
            <button className="zb" onClick={zReset}>⊙</button>
          </div>
          <button className="fab" onClick={onOpenGrid}>⊞</button>
        </>
      )}
    </>
  )
}
