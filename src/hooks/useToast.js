import { useState, useRef } from 'react'

export function useToast() {
  const [msg, setMsg] = useState('')
  const timer = useRef(null)

  function showToast(text) {
    setMsg(text)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setMsg(''), 2600)
  }

  return { msg, showToast }
}
