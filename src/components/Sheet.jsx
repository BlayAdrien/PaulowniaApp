export default function Sheet({ open, onClose, title, children }) {
  return (
    <div
      className={`ov${open ? ' open' : ''}`}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="sh"
        onTouchStart={e => { e.currentTarget._sy = e.touches[0].clientY }}
        onTouchEnd={e => {
          if (e.changedTouches[0].clientY - (e.currentTarget._sy || 0) > 85) onClose()
        }}
      >
        <div className="shh" />
        <div className="shhdr">
          <span className="shtit">{title}</span>
          <button className="shx" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
