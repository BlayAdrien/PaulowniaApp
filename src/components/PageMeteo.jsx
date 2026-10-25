import { useState } from 'react'

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const parse = s => new Date(s + 'T12:00:00')
const num = v => (v === '' || v == null || isNaN(parseFloat(v))) ? null : parseFloat(v)

/* Lundi d'une semaine ISO "2026-W12" */
function isoWeekMonday(key) {
  const [y, w] = key.split('-W').map(Number)
  const jan4 = new Date(y, 0, 4, 12)
  const mon = new Date(jan4)
  mon.setDate(jan4.getDate() - ((jan4.getDay() || 7) - 1) + (w - 1) * 7)
  return mon
}

/* Dates de début et de fin couvertes par un relevé */
function entryDays(e) {
  const p = e.period || {}
  if (!p.sortKey) return null
  if (p.type === 'day')   return [p.sortKey, p.sortKey]
  if (p.type === 'week')  { const m = isoWeekMonday(p.sortKey); const end = new Date(m); end.setDate(end.getDate() + 6); return [ymd(m), ymd(end)] }
  if (p.type === 'range') return [p.sortKey, p.end && p.end >= p.sortKey ? p.end : p.sortKey]
  return null
}

function entryTemp(e) {
     if (num(e.tavg) != null) return num(e.tavg)
     const a = num(e.tmin), b = num(e.tmax)
     if (a != null && b != null) return (a + b) / 2
     return a ?? b
}

/* Arrosage en mm : 1 litre réparti sur 1 m² = 1 mm */
export function waterMm(e) {
  const l = num(e.water); if (l == null) return null
  return l / (num(e.area) || 1)
}

/* Répartit chaque relevé sur les jours qu'il couvre, puis cumule par mois */
function monthlyStats(meteo, year) {
  const months = MONTHS.map(() => ({ rain: 0, water: 0, tSum: 0, tDays: 0 }))
  meteo.forEach(e => {
    const range = entryDays(e); if (!range) return
    const start = parse(range[0]), end = parse(range[1])
    const nDays = Math.min(400, Math.round((end - start) / 86400000) + 1)
    const isWater = e.kind === 'water'
    const rain = isWater ? null : num(e.rain), temp = isWater ? null : entryTemp(e), water = isWater ? waterMm(e) : null
    for (let i = 0; i < nDays; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i)
      if (d.getFullYear() !== year) continue
      const m = months[d.getMonth()]
      if (rain != null) m.rain += rain / nDays
      if (water != null) m.water += water / nDays
      if (temp != null) { m.tSum += temp; m.tDays++ }
    }
  })
  return months.map(m => ({ rain: m.rain, water: m.water, temp: m.tDays ? m.tSum / m.tDays : null }))
}

function entryYears(e) {
  const r = entryDays(e)
  return r ? [parse(r[0]).getFullYear(), parse(r[1]).getFullYear()] : []
}

const f1 = v => v.toLocaleString('fr-FR', { maximumFractionDigits: 1 })
const Dot = ({ c }) => <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: c, marginRight: 2 }} />

export default function PageMeteo({ meteo, active, onAdd, onDelete }) {
  const thisYear = new Date().getFullYear()
  const [year, setYear] = useState(thisYear)

  const years = meteo.flatMap(entryYears)
  const minY = Math.min(thisYear, ...years)
  const maxY = Math.max(thisYear, ...years)

  const stats = monthlyStats(meteo, year)
  const maxTot = Math.max(...stats.map(m => m.rain + m.water), 1)
  const totalRain  = stats.reduce((s, m) => s + m.rain, 0)
  const totalWater = stats.reduce((s, m) => s + m.water, 0)
  const temps = stats.filter(m => m.temp != null)
  const yearTemp = temps.length ? temps.reduce((s, m) => s + m.temp, 0) / temps.length : null

  const yearEntries = meteo.filter(e => entryYears(e).includes(year))

  const navBtn = disabled => ({
    width: 32, height: 32, borderRadius: 10, border: '1.5px solid var(--sand)', background: 'var(--parch)',
    color: 'var(--bark)', fontSize: 16, fontWeight: 700, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? .35 : 1,
  })

  return (
    <div id="page-meteo" className={`page page-meteo${active ? ' active' : ''}`}>
      <div className="mtb">
        <span>Relevés météo</span>
        <button className="btn-am" onClick={onAdd}>＋ Relevé</button>
      </div>
      <div className="mscroll">
        <div className="msum">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="mstit" style={{ margin: 0 }}>💧 Eau & 🌡 température</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button style={navBtn(year <= minY)} disabled={year <= minY} onClick={() => setYear(y => y - 1)}>‹</button>
              <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)', minWidth: 42, textAlign: 'center' }}>{year}</span>
              <button style={navBtn(year >= maxY)} disabled={year >= maxY} onClick={() => setYear(y => y + 1)}>›</button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {stats.map((m, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '34px 1fr 74px 44px', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <span style={{ fontWeight: 700, color: 'var(--bark)' }}>{MONTHS[i].slice(0, 3)}</span>
                <div style={{ height: 10, background: 'var(--parch)', borderRadius: 5, overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${(m.rain / maxTot) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #5b8dd9, #3d6ea8)' }} />
                  <div style={{ width: `${(m.water / maxTot) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #6cc46f, #3f8f45)' }} />
                </div>
                <span style={{ textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  <span style={{ color: m.rain ? 'var(--blue)' : 'var(--barkl)' }}>{f1(m.rain)}</span>
                  {m.water > 0 && <span style={{ color: '#3f8f45' }}> +{f1(m.water)}</span>}
                  <span style={{ color: 'var(--barkl)', fontWeight: 500 }}> mm</span>
                </span>
                <span style={{ textAlign: 'right', color: m.temp != null ? 'var(--ink)' : 'var(--barkl)' }}>{m.temp != null ? `${f1(m.temp)}°` : '—'}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--sand)', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--bark)' }}>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span><Dot c="#3d6ea8" /> Pluie {year} : <strong>{f1(totalRain)} mm</strong></span>
              <span><Dot c="#3f8f45" /> Arrosage : <strong>{f1(totalWater)} mm</strong></span>
            </span>
            <span>Moyenne : <strong>{yearTemp != null ? `${f1(yearTemp)}°` : '—'}</strong></span>
          </div>
        </div>

        {yearEntries.length === 0
          ? <div className="empty"><div className="ei">🌤️</div><p>Aucun relevé en {year}.<br />Appuyez <strong>＋ Relevé</strong>.</p></div>
          : yearEntries.map(e => {
              if (e.kind === 'water') return (
                <div key={e.id} className="mc">
                  <div className="mch">
                    <div className="mcper">📅 {e.period?.label || '—'}</div>
                    <div className="mcico">🚿</div>
                    <div className="mcsum" style={{ color: '#3f8f45' }}>Arrosage · {e.water} L/arbre</div>
                    <button className="mcdel" onClick={() => onDelete(e.id)}>🗑</button>
                  </div>
                  <div className="mcb">
                    <div><div className="mfl">Par arbre</div><div className="mfv">{e.water}</div><div className="mfu">litres</div></div>
                    <div><div className="mfl">Équivalent</div><div className="mfv">{f1(waterMm(e) || 0)}</div><div className="mfu">mm</div></div>
                  </div>
                  {e.notes && <div className="mcnotes">{e.notes}</div>}
                </div>
              )
              const tr = num(e.tavg) != null ? `${e.tavg}°`
               : ((e.tmin !== '' && e.tmin != null) || (e.tmax !== '' && e.tmax != null)) ? `${e.tmin ?? '—'}°/${e.tmax ?? '—'}°` : ''
              return (
                <div key={e.id} className="mc">
                  <div className="mch">
                    <div className="mcper">📅 {e.period?.label || '—'}</div>
                    <div className="mcico">{e.weather || ''}</div>
                    <div className="mcsum">{tr ? `🌡 ${tr}` : ''}{e.rain ? ` · 💧${e.rain}mm` : ''}</div>
                    <button className="mcdel" onClick={() => onDelete(e.id)}>🗑</button>
                  </div>
                  <div className="mcb">
                    {tr        && <div><div className="mfl">Température</div><div className="mfv">{tr}</div><div className="mfu">{num(e.tavg) != null ? 'moyenne' : 'min/max'}</div></div>}
                    {e.rain !== '' && <div><div className="mfl">Pluie</div><div className="mfv">{e.rain}</div><div className="mfu">mm</div></div>}
                    {e.hum  !== '' && <div><div className="mfl">Humidité</div><div className="mfv">{e.hum}</div><div className="mfu">%</div></div>}
                    {e.wind !== '' && <div><div className="mfl">Vent</div><div className="mfv">{e.wind}</div><div className="mfu">km/h</div></div>}
                    {e.sun  !== '' && <div><div className="mfl">Soleil</div><div className="mfv">{e.sun}</div><div className="mfu">h</div></div>}
                  </div>
                  {e.notes && <div className="mcnotes">{e.notes}</div>}
                </div>
              )
            })
        }
      </div>
    </div>
  )
}