/* Réduit une photo avant envoi : 1600 px max, JPEG, moins de ~600 Ko */
export async function compressImage(file, maxSide = 1600, maxBytes = 600_000) {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
    const w = Math.round(img.naturalWidth * scale), h = Math.round(img.naturalHeight * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    canvas.getContext('2d').drawImage(img, 0, 0, w, h)
    let q = 0.82, blob
    do {
      blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', q))
      q -= 0.12
    } while (blob && blob.size > maxBytes && q > 0.3)
    return blob
  } finally {
    URL.revokeObjectURL(url)
  }
}
