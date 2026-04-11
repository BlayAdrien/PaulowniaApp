import { isoWeek, weekMonday } from '../utils/helpers'

export default function PageMeteo({ meteo, active, onAdd, onDelete }) {
  const wkMap = {}
  meteo.forEach(e => {
    const r = parseFloat(e.rain) || 0; if (!r) return
    const wk = e.period?.type === 'week' ? e.period.sortKey
             : e.period?.type === 'day'  ? isoWeek(e.period.sortKey)
             : e.period?.type === 'range'? isoWeek(e.period.sortKey) : null
    if (!wk) return
    wkMap[wk] = (wkMap[wk] || 0) + r
  })
  const wkRain = Object.entries(wkMap).sort((a, b) => a[0].localeCompare(b[0])).slice(-12)
  const maxR   = Math.max(...wkRain.map(w => w[1]), 1)
  const total  = meteo.reduce((s, e) => s + (parseFloat(e.rain) || 0), 0)

  return (
    <div id="page-meteo" className={`page page-meteo${active ? ' active' : ''}`}>
      <div className="mtb">
        <span>Relevés météo</span>
        <button className="btn-am" onClick={onAdd}>＋ Relevé</button>
      </div>
      <div className="mscroll">
        {meteo.length === 0
          ? <div className="empty"><div className="ei">🌤️</div><p>Aucun relevé.<br />Appuyez <strong>＋ Relevé</strong>.</p></div>
          : <>
            <div className="msum">
              <div className="mstit">💧 Précipitations par semaine</div>
              <div className="mbars">
                {wkRain.length
                  ? wkRain.map(([wk, mm]) => {
                      const h   = Math.max(2, Math.round((mm / maxR) * 42))
                      const mon = weekMonday(wk)
                      const lbl = mon.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
                      return <div key={wk} className="mbw"><div className="mb" style={{ height: h }} /><div className="mbl">{lbl}</div></div>
                    })
                  : <span style={{ fontSize: 12, color: 'var(--barkl)' }}>Ajoutez des précipitations pour voir le graphe</span>
                }
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--bark)' }}>
                Total cumulé : <strong>{total.toFixed(1)} mm</strong>
              </div>
            </div>

            {meteo.map(e => {
              const tr = ((e.tmin !== '' && e.tmin != null) || (e.tmax !== '' && e.tmax != null))
                ? `${e.tmin ?? '—'}°/${e.tmax ?? '—'}°` : ''
              return (
                <div key={e.id} className="mc">
                  <div className="mch">
                    <div className="mcper">📅 {e.period?.label || '—'}</div>
                    <div className="mcico">{e.weather || ''}</div>
                    <div className="mcsum">{tr ? `🌡 ${tr}` : ''}{e.rain ? ` · 💧${e.rain}mm` : ''}</div>
                    <button className="mcdel" onClick={() => onDelete(e.id)}>🗑</button>
                  </div>
                  <div className="mcb">
                    {tr        && <div><div className="mfl">Température</div><div className="mfv">{tr}</div><div className="mfu">min/max</div></div>}
                    {e.rain !== '' && <div><div className="mfl">Pluie</div><div className="mfv">{e.rain}</div><div className="mfu">mm</div></div>}
                    {e.hum  !== '' && <div><div className="mfl">Humidité</div><div className="mfv">{e.hum}</div><div className="mfu">%</div></div>}
                    {e.wind !== '' && <div><div className="mfl">Vent</div><div className="mfv">{e.wind}</div><div className="mfu">km/h</div></div>}
                    {e.sun  !== '' && <div><div className="mfl">Soleil</div><div className="mfv">{e.sun}</div><div className="mfu">h</div></div>}
                  </div>
                  {e.notes && <div className="mcnotes">{e.notes}</div>}
                </div>
              )
            })}
          </>
        }
      </div>
    </div>
  )
}
