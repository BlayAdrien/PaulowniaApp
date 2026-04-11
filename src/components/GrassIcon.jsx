import { GRASS_DEFS, GRASS_STYLE } from '../utils/constants'

export default function GrassIcon({ gkey, size = 42 }) {
  const idx = GRASS_DEFS.findIndex(g => g.key === gkey)
  const gi  = idx >= 0 ? idx : 0
  const { greenRatio } = GRASS_STYLE[gi]
  const cx = size / 2, cy = size / 2
  const r  = size * 0.42
  const greenR = r * greenRatio
  const gradId = `gg-${gkey}-${size}`

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="#111" opacity="0.88" />
      {greenRatio > 0 && (
        <>
          <defs>
            <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#5dcc30" />
              <stop offset="60%"  stopColor="#38a022" />
              <stop offset="100%" stopColor="#1e6010" />
            </radialGradient>
          </defs>
          <circle cx={cx} cy={cy} r={greenR} fill={`url(#${gradId})`} opacity="0.93" />
        </>
      )}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="0.8" />
    </svg>
  )
}
