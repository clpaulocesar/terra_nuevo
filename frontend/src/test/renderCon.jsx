import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { TemaProvider } from '../context/TemaContext.jsx';
import { AccesibilidadProvider } from '../context/AccesibilidadContext.jsx';
import { ModoAccesibleProvider } from '../accesibilidad/ModoAccesibleContext.jsx';
import { SesionClienteProvider } from '../context/SesionClienteContext.jsx';
import { ClienteProvider } from '../context/ClienteContext.jsx';
import { CarritoProvider } from '../context/CarritoContext.jsx';
import { CatalogoProvider } from '../context/CatalogoContext.jsx';
import { NavegacionProvider } from '../navegacion/NavegacionContext.jsx';
import { TutorialProvider } from '../context/TutorialContext.jsx';

// Monta un componente con los mismos providers que App.jsx y un router en memoria.
export function renderCon(ui, { ruta = '/', path = '*' } = {}) {
  return render(
    <TemaProvider><AccesibilidadProvider><ModoAccesibleProvider><SesionClienteProvider><ClienteProvider><CarritoProvider><CatalogoProvider>
      <MemoryRouter initialEntries={[ruta]}>
        <NavegacionProvider>
          <TutorialProvider>
            <Routes><Route path={path} element={ui} /></Routes>
          </TutorialProvider>
        </NavegacionProvider>
      </MemoryRouter>
    </CatalogoProvider></CarritoProvider></ClienteProvider></SesionClienteProvider></ModoAccesibleProvider></AccesibilidadProvider></TemaProvider>
  );
}

// Reglas de axe que jsdom no puede evaluar bien (contraste necesita render real).
export const OPCIONES_AXE = { rules: { 'color-contrast': { enabled: false } } };
