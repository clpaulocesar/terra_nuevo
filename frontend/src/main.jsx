import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Los iconos de Material Symbols son ligaduras de texto: hasta que la fuente
// termina de cargar se verían palabras en inglés (search, expand_more...).
// Solo se muestran cuando la fuente está realmente disponible.
document.fonts
  ?.load('400 24px "Material Symbols Outlined"')
  .then((fuentes) => {
    console.log("cargadas", fuentes?.length); if (fuentes && fuentes.length > 0) document.documentElement.classList.add('iconos-listas');
  })
  .catch(() => {});

