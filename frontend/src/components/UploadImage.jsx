import React, { useState, useEffect } from 'react'

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
            <img src={preview} alt="preview" style={{ maxWidth: 240, maxHeight: 240, display: 'block' }} />
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
