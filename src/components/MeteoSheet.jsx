import { useState, useEffect } from 'react'
import Sheet from './Sheet'
import { today, fmt, isoWeek } from '../utils/helpers'

const WEATHERS = ['☀️','⛅','☁️','🌧️','⛈️','🌨️','🌫️','💨']

export default function MeteoSheet({ open, onClose, onSave }) {
  const [kind,    setKind]   = useState('rain')   // 'rain' = précipitations · 'water' = arrosage
  const [water,   setWater]  = useState('')
  const [area,    setArea]   = useState('1')
  const [ptype,   setPtype]  = useState('day')
  const [d1,      setD1]     = useState(today())
  const [wk,      setWk]     = useState('')
  const [fr,      setFr]     = useState('')
  const [to,      setTo]     = useState('')
  const [weather, setWeather]= useState('')
  const [tavg,    setTavg]   = useState('')
  const [rain,    setRain]   = useState('')
  const [hum,     setHum]    = useState('')
  const [wind,    setWind]   = useState('')
  const [sun,     setSun]    = useState('')
  const [notes,   setNotes]  = useState('')

  useEffect(() => {
    if (open) {
      setD1(today()); setWeather(''); setTavg('')
      setRain(''); setHum(''); setWind(''); setSun(''); setNotes(''); setPtype('day')
      setKind('rain'); setWater('')
    }
  }, [open])

  function getPeriod() {
    if (ptype === 'day') {
      if (!d1) return null
      return { type: 'day', label: fmt(d1), sortKey: d1 }
    }
    if (ptype === 'week') {
      if (!wk) return null
      const d = new Date(wk + 'T12:00:00'), end = new Date(d); end.setDate(end.getDate() + 6)
      const fl = x => x.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
      return { type: 'week', label: `Sem. ${fl(d)} – ${fl(end)}`, sortKey: isoWeek(wk) }
    }
    if (ptype === 'range') {
      if (!fr) return null
      return { type: 'range', label: `${fmt(fr)}${to ? ' → ' + fmt(to) : ''}`, sortKey: fr, end: to || fr }
      }
  }

  function handleSave() {
    const period = getPeriod()
    if (!period) return
    if (kind === 'water') {
      if (!water) return
      onSave({ kind: 'water', period, water, area: area || '1', notes })
      return
    }
    onSave({ kind: 'rain', period, weather, tavg, rain, hum, wind, sun, notes })
  }

  return (
    <Sheet open={open} onClose={onClose} title={kind === 'water' ? '🚿 Nouvel arrosage' : '🌦️ Nouveau relevé'}>
      <div className="fb">
        <div className="fr full"><div className="fld">
          <label>Type de relevé</label>
          <div className="prow">
            {[['rain','Précipitations'],['water','Arrosage']].map(([k,lbl]) => (
              <button key={k} className={`ptb${kind === k ? ' sel' : ''}`} onClick={() => setKind(k)}
                style={kind === k && k === 'water' ? { background: '#3f8f45', borderColor: '#3f8f45' } : undefined}>{lbl}</button>
            ))}
          </div>
        </div></div>

        <div className="fr full"><div className="fld">
          <label>Type de période</label>
          <div className="prow">
            {[['day','Journée'],['week','Semaine'],['range','Période libre']].map(([pt,lbl]) => (
              <button key={pt} className={`ptb${ptype === pt ? ' sel' : ''}`} onClick={() => setPtype(pt)}>{lbl}</button>
            ))}
          </div>
        </div></div>

        {ptype === 'day'   && <div className="fr full"><div className="fld"><label>Date</label><input type="date" value={d1} onChange={e => setD1(e.target.value)} /></div></div>}
        {ptype === 'week'  && <div className="fr full"><div className="fld"><label>Semaine — choisir le lundi</label><input type="date" value={wk} onChange={e => setWk(e.target.value)} /></div></div>}
        {ptype === 'range' && <div className="fr">
          <div className="fld"><label>Du</label><input type="date" value={fr} onChange={e => setFr(e.target.value)} /></div>
          <div className="fld"><label>Au</label><input type="date" value={to} onChange={e => setTo(e.target.value)} /></div>
        </div>}

        {kind === 'water' ? (
          <div className="fr">
            <div className="fld"><label>Litres par arbre</label><input type="number" value={water} onChange={e => setWater(e.target.value)} min="0" inputMode="decimal" placeholder="ex : 10" /></div>
            <div className="fld"><label>Surface arrosée (m²)</label><input type="number" value={area} onChange={e => setArea(e.target.value)} min="0.1" step="0.1" inputMode="decimal" /></div>
          </div>
        ) : (<>
        <div className="fr full"><div className="fld">
          <label>Temps</label>
          <div className="wpick">
            {WEATHERS.map(w => <button key={w} className={`wpb${weather === w ? ' sel' : ''}`} onClick={() => setWeather(w)}>{w}</button>)}
          </div>
        </div></div>

        <div className="fr full">
          <div className="fld"><label>T° moyenne (°C)</label><input type="number" value={tavg} onChange={e => setTavg(e.target.value)} inputMode="decimal" step="0.1" /></div>
        </div>
        <div className="fr">
          <div className="fld"><label>Précip. (mm)</label><input type="number" value={rain} onChange={e => setRain(e.target.value)} min="0" inputMode="decimal" /></div>
          <div className="fld"><label>Humidité (%)</label><input type="number" value={hum} onChange={e => setHum(e.target.value)} min="0" max="100" inputMode="numeric" /></div>
        </div>
        <div className="fr">
          <div className="fld"><label>Vent (km/h)</label><input type="number" value={wind} onChange={e => setWind(e.target.value)} min="0" inputMode="numeric" /></div>
          <div className="fld"><label>Soleil (h)</label><input type="number" value={sun} onChange={e => setSun(e.target.value)} min="0" max="24" step="0.5" inputMode="decimal" /></div>
        </div>
        </>)}
        {kind === 'water' && water && (
          <div style={{ fontSize: 12, color: '#3f8f45', fontWeight: 600, padding: '0 2px 6px' }}>
            ≈ {(parseFloat(water) / (parseFloat(area) || 1)).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} mm d'eau au pied
          </div>
        )}
        <div className="fr full"><div className="fld"><label>Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={kind === 'water' ? 'Arbres arrosés, goutte-à-goutte…' : 'Gelée, grêle, vent fort…'} /></div></div>
      </div>
      <div className="brow">
        <button className="bp" onClick={handleSave}>💾 Enregistrer</button>
      </div>
    </Sheet>
  )
}
