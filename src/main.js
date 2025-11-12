import './style.css'

const el = document.getElementById('msg')
el.textContent = 'Cliente servido por Vite ✅'

if (import.meta.hot) {
  import.meta.hot.accept()
}
