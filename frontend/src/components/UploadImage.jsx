import React, { useState, useEffect, useRef } from 'react'

export default function UploadImage({ selectedTexture }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [status, setStatus] = useState(null)
  const [blend, setBlend] = useState('overlay')

  useEffect(() => {
    if (!file) {
      setPreview(null)
      return undefined
    }

    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  const canvasRef = useRef(null)
  const [textureLoadError, setTextureLoadError] = useState(null)

  // Draw combined preview on canvas whenever preview, selectedTexture or blend change
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !preview) return

    const ctx = canvas.getContext('2d')
    setTextureLoadError(null)

    const baseImg = new Image()
    baseImg.crossOrigin = 'anonymous'
    baseImg.onload = () => {
      // Resize canvas to image size, but limit max dimension for UI
      const maxDim = 800
      let w = baseImg.width
      let h = baseImg.height
      if (Math.max(w, h) > maxDim) {
        const scale = maxDim / Math.max(w, h)
        w = Math.round(w * scale)
        h = Math.round(h * scale)
      }
      canvas.width = w
      canvas.height = h

      // Draw base image scaled to canvas
      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'source-over'
      ctx.drawImage(baseImg, 0, 0, w, h)

      // If there's a selected texture, draw it with the chosen blend mode
      if (selectedTexture) {
        const texImg = new Image()
        texImg.crossOrigin = 'anonymous'
        texImg.onload = () => {
          try {
            // set blend (use the selected blend from state)
            const blendOp = blend || 'overlay'
            // draw texture covering the canvas
            ctx.globalCompositeOperation = blendOp
            // draw texture stretched to cover
            ctx.drawImage(texImg, 0, 0, w, h)
            // reset composite mode
            ctx.globalCompositeOperation = 'source-over'
          } catch (err) {
            console.warn('Error compositing texture on canvas', err)
            setTextureLoadError('No se pudo aplicar la textura en la vista previa')
          }
        }
        texImg.onerror = () => {
          setTextureLoadError('Error cargando la textura (CORS o URL inválida)')
        }
        texImg.src = selectedTexture
      }
    }
    baseImg.onerror = () => {
      setPreview(null)
    }
    baseImg.src = preview
  }, [preview, selectedTexture, blend])

  function onFileChange(e) {
    const f = e.target.files && e.target.files[0]
    setFile(f || null)
    setStatus(null)
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (!file) {
      setStatus({ ok: false, msg: 'Selecciona una imagen primero' })
      return
    }

    const form = new FormData()
    form.append('image', file)
    // incluir la textura seleccionada (puede ser null)
    if (selectedTexture) form.append('texture', selectedTexture)
    // incluir modo de mezcla
    if (blend) form.append('blend', blend)

    try {
      setStatus({ ok: null, msg: 'Subiendo...' })
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: form,
      })

      if (!res.ok) throw new Error(await res.text())
      const json = await res.json().catch(() => null)
      setStatus({ ok: true, msg: json && json.message ? json.message : 'Subida completada' })
    } catch (err) {
      setStatus({ ok: false, msg: err.message || 'Error al subir' })
    }
  }

  return (
    <div>
      <h3>Subir imagen</h3>
      <form onSubmit={onSubmit}>
        <input type="file" accept="image/*" onChange={onFileChange} />
        <div style={{ marginTop: 8 }}>
          {preview ? (
            <div>
              <canvas ref={canvasRef} style={{ maxWidth: 480, width: '100%', height: 'auto', border: '1px solid #ddd' }} />
              {textureLoadError && <div style={{ color: 'crimson' }}>{textureLoadError}</div>}
            </div>
          ) : (
            <div style={{ color: '#666' }}>Sin vista previa</div>
          )}
        </div>
        <div style={{ marginTop: 8 }}>
            <button type="submit">Enviar al backend</button>
        </div>
      </form>

        <div style={{ marginTop: 8 }}>
          <label>
            <strong>Blend:</strong>
            <select value={blend} onChange={(e) => setBlend(e.target.value)} style={{ marginLeft: 8 }}>
              <option value="overlay">overlay</option>
              <option value="multiply">multiply</option>
              <option value="screen">screen</option>
              <option value="soft-light">soft-light</option>
              <option value="hard-light">hard-light</option>
              <option value="darken">darken</option>
              <option value="lighten">lighten</option>
              <option value="difference">difference</option>
              <option value="exclusion">exclusion</option>
              <option value="color-dodge">color-dodge</option>
              <option value="color-burn">color-burn</option>
            </select>
          </label>
        </div>

      <div style={{ marginTop: 8 }}>
        <strong>Textura seleccionada:</strong> {selectedTexture || 'ninguna'}
      </div>

      {status && (
        <div style={{ marginTop: 8, color: status.ok === false ? 'crimson' : 'green' }}>{status.msg}</div>
      )}
    </div>
  )
}
