/** Shrinks a picked photo in the browser so uploads stay small and fast on mobile data. */
const MAX_DATA_URL = 1_300_000

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => { URL.revokeObjectURL(url); resolve(image) }
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file could not be opened as a photo.')) }
    image.src = url
  })
}

export async function compressPhoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Choose a photo (JPG, PNG or WebP).')
  if (file.size > 25 * 1024 * 1024) throw new Error('That photo is over 25 MB. Choose a smaller one.')
  const image = await loadImage(file)
  for (const [maxSide, quality] of [[1440, 0.82], [1200, 0.74], [960, 0.68], [720, 0.6]] as const) {
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) break
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', quality)
    if (dataUrl.length <= MAX_DATA_URL) return dataUrl
  }
  throw new Error('That photo is too large to upload. Try another one.')
}
