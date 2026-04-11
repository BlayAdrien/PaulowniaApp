import { TARGET_PX, MARGIN, HEALTH_DEFS, GRASS_DEFS, GRASS_STYLE } from './constants'

export function detectSpacing(trees) {
  if (trees.length < 2) return 5
  const xs = [...new Set(trees.map(t => Math.round(t.xm * 2) / 2))].sort((a, b) => a - b)
  if (xs.length < 2) return 5
  const diffs = []
  for (let i = 1; i < Math.min(xs.length, 8); i++) {
    const d = xs[i] - xs[i - 1]
    if (d > 0.3) diffs.push(d)
  }
  if (!diffs.length) return 5
  return diffs.reduce((a, b) => a + b, 0) / diffs.length
}

export function calcPxPerM(trees) {
  return TARGET_PX / detectSpacing(trees)
}

export function m2c(xm, ym, panX, panY, ppm, zoom) {
  return { cx: panX + MARGIN + xm * ppm * zoom, cy: panY + MARGIN + ym * ppm * zoom }
}
export function c2m(cx, cy, panX, panY, ppm, zoom) {
  return { xm: (cx - panX - MARGIN) / (ppm * zoom), ym: (cy - panY - MARGIN) / (ppm * zoom) }
}

export function treeRadius(hcm, zoom) {
  const base = TARGET_PX * 0.35
  const h = parseFloat(hcm) || 0
  let f
  if (!h)        f = 0.50
  else if (h <= 20)  f = 0.28
  else if (h <= 50)  f = 0.40
  else if (h <= 100) f = 0.54
  else if (h <= 150) f = 0.66
  else if (h <= 200) f = 0.78
  else if (h <= 300) f = 0.90
  else if (h <= 500) f = 1.05
  else if (h <= 1000)f = 1.22
  else if (h <= 1500)f = 1.40
  else               f = 1.62
  return Math.max(3, base * f) * zoom
}

export function hColors(key) {
  const h = HEALTH_DEFS.find(x => x.key === key)
  return h ? { crown: h.crown, trunk: h.trunk } : { crown: '#4a8a20', trunk: '#2d5a10' }
}

export function drawGrass(ctx, cx, cy, r, grassKey) {
  const idx = GRASS_DEFS.findIndex(g => g.key === grassKey)
  const gi  = idx >= 0 ? idx : 0
  const gs  = GRASS_STYLE[gi]
  const gr  = Math.max(3.5, r * 0.42)

  // Fond noir = toile tissée
  ctx.beginPath()
  ctx.arc(cx, cy, gr, 0, Math.PI * 2)
  ctx.fillStyle = '#111'
  ctx.globalAlpha = 0.88
  ctx.fill()

  // Vert qui grandit du centre
  if (gs.greenRatio > 0) {
    const greenR = gr * gs.greenRatio
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, greenR)
    grd.addColorStop(0,   '#5dcc30')
    grd.addColorStop(0.6, '#38a022')
    grd.addColorStop(1,   '#1e6010')
    ctx.beginPath()
    ctx.arc(cx, cy, greenR, 0, Math.PI * 2)
    ctx.fillStyle = grd
    ctx.globalAlpha = 0.92
    ctx.fill()
  }

  // Contour
  ctx.beginPath()
  ctx.arc(cx, cy, gr, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'
  ctx.lineWidth = 0.8
  ctx.globalAlpha = 1
  ctx.stroke()
}

export function drawTree(ctx, cx, cy, r, crown, trunk, selected, label, grassKey) {
  const tw  = Math.max(1.5, r * 0.20)
  const th  = r * 0.60
  const crx = r
  const cry = r * 0.85
  const crY = cy - th - cry * 0.55

  // Ombre
  if (r > 5) {
    ctx.beginPath()
    ctx.ellipse(cx + r * 0.15, crY + cry * 0.1, crx * 0.85, cry * 0.3, 0.3, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0,0,0,0.10)'
    ctx.globalAlpha = 1
    ctx.fill()
  }

  // Herbe au pied
  if (r > 4) drawGrass(ctx, cx, cy + r * 0.12, r, grassKey || 'g0')

  // Tronc
  ctx.beginPath()
  ctx.roundRect(cx - tw / 2, cy - th, tw, th, tw / 3)
  ctx.fillStyle = trunk
  ctx.globalAlpha = 0.92
  ctx.fill()

  // Couronne
  ctx.beginPath()
  ctx.ellipse(cx, crY, crx, cry, 0, 0, Math.PI * 2)
  ctx.fillStyle = crown
  ctx.globalAlpha = 0.94
  ctx.fill()

  // Sélection
  if (selected) {
    ctx.beginPath()
    ctx.ellipse(cx, crY, crx + 3, cry + 3, 0, 0, Math.PI * 2)
    ctx.strokeStyle = '#f0a030'
    ctx.lineWidth = 2.5
    ctx.globalAlpha = 1
    ctx.stroke()
  }

  // Reflet
  if (r > 4) {
    ctx.beginPath()
    ctx.ellipse(cx - crx * 0.28, crY - cry * 0.28, crx * 0.32, cry * 0.22, -0.4, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.22)'
    ctx.globalAlpha = 1
    ctx.fill()
  }

  // Label
  if (label != null && r > 3) {
    const fs = Math.max(7, Math.min(12, r * 0.62))
    ctx.font = `700 ${fs}px DM Sans,sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    if (r > 9) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.globalAlpha = 1
      ctx.fillText(String(label), cx, crY)
    } else {
      const ly  = cy + th * 0.3 + fs * 0.5 + 2
      const tw2 = ctx.measureText(String(label)).width + 6
      ctx.fillStyle = 'rgba(245,240,228,0.9)'
      ctx.globalAlpha = 0.9
      ctx.beginPath(); ctx.roundRect(cx - tw2 / 2, ly - fs / 2 - 1, tw2, fs + 2, 2); ctx.fill()
      ctx.globalAlpha = 1
      ctx.fillStyle = '#5c3d1e'
      ctx.fillText(String(label), cx, ly)
    }
  }
  ctx.globalAlpha = 1
}

export function renderCanvas({ canvas, trees, fw, fh, panX, panY, ppm, zoom, selId, gridPrev }) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const wrap = canvas.parentElement
  if (!wrap) return
  const dpr = window.devicePixelRatio || 1
  const W = wrap.clientWidth, H = wrap.clientHeight
  canvas.width  = W * dpr; canvas.height = H * dpr
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px'
  ctx.scale(dpr, dpr)

  // Fond
  const grad = ctx.createLinearGradient(0, 0, W, H)
  grad.addColorStop(0, '#ece2c4'); grad.addColorStop(1, '#d8c998')
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H)

  // Grille déco
  ctx.strokeStyle = 'rgba(92,61,30,0.06)'; ctx.lineWidth = 1
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
  for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }

  // Bordure champ
  const { cx: bx, cy: by } = m2c(0, 0, panX, panY, ppm, zoom)
  ctx.strokeStyle = 'rgba(92,61,30,0.3)'; ctx.lineWidth = 1.5
  ctx.setLineDash([8, 5])
  ctx.strokeRect(bx, by, fw * ppm * zoom, fh * ppm * zoom)
  ctx.setLineDash([])

  // Preview grille
  if (gridPrev) {
    ctx.strokeStyle = 'rgba(199,134,61,0.55)'; ctx.lineWidth = 1.2; ctx.setLineDash([5, 4])
    gridPrev.forEach(p => {
      const { cx, cy } = m2c(p.xm, p.ym, panX, panY, ppm, zoom)
      ctx.beginPath(); ctx.arc(cx, cy, 10 * zoom, 0, Math.PI * 2); ctx.stroke()
    })
    ctx.setLineDash([])
  }

  // Arbres
  trees.forEach(t => {
    const { cx, cy } = m2c(t.xm, t.ym, panX, panY, ppm, zoom)
    const r = treeRadius(t.hauteur, zoom)
    const { crown, trunk } = hColors(t.sante)
    drawTree(ctx, cx, cy, r, crown, trunk, t.id === selId, t._label, t.grass || 'g0')
  })
}
