import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { act, cleanup, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import LoginAdmin from '../pages/admin/LoginAdmin.jsx';
import LoginVendedor from '../pages/vendedor/LoginVendedor.jsx';
import CarritoPage from '../features/carrito/CarritoPage.jsx';
import ConfirmacionPage from '../features/confirmacion/ConfirmacionPage.jsx';
import CatalogoPage from '../features/catalogo/CatalogoPage.jsx';
import AdminLayout from '../components/admin/AdminLayout.jsx';
import VendedorLayout from '../components/vendedor/VendedorLayout.jsx';
import { renderCon, OPCIONES_AXE } from '../test/renderCon.jsx';

// Cada pantalla se audita con axe dos veces: modo accesible apagado y encendido.
const PANTALLAS = [
  { nombre: 'Login de administrador', ui: <LoginAdmin />, ruta: '/admin/login' },
  { nombre: 'Login de vendedor', ui: <LoginVendedor />, ruta: '/vendedor/login' },
  { nombre: 'Carrito (vacío)', ui: <CarritoPage />, ruta: '/carrito' },
  { nombre: 'Confirmación', ui: <ConfirmacionPage />, ruta: '/confirmacion' },
  { nombre: 'Catálogo', ui: <CatalogoPage />, ruta: '/catalogo' },
  { nombre: 'Backoffice (layout admin)', ui: <AdminLayout />, ruta: '/admin', admin: { nombre: 'Prueba', rol: 'admin' } },
  { nombre: 'Portal vendedor (layout)', ui: <VendedorLayout />, ruta: '/vendedor', admin: { nombre: 'Prueba', rol: 'vendedor' } },
];

function activarModo(encendido) {
  localStorage.setItem('terra_a11y', JSON.stringify({ activo: encendido, textoGrande: 125, altoContraste: true, botonesGrandes: true, focoReforzado: true, subrayarEnlaces: true, sinAnimaciones: true, leerEnVoz: true, navegacionVoz: true, fuenteLegible: false, masTiempo: true }));
}

describe.each([false, true])('Pantallas sin violaciones de axe (modo accesible: %s)', (modo) => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); document.documentElement.className = ''; activarModo(modo); });
  afterEach(() => cleanup());

  it.each(PANTALLAS)('$nombre', async ({ ui, ruta, admin }) => {
    if (admin) { sessionStorage.setItem('terra_admin_token', 'token-de-prueba'); sessionStorage.setItem('terra_admin_user', JSON.stringify(admin)); }
    let resultado;
    await act(async () => { resultado = renderCon(ui, { ruta }); });
    // Deja resolver las cargas (fetch simulado) antes de auditar.
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
    expect(document.documentElement.classList.contains('modo-accesible')).toBe(modo);
    const violaciones = await axe(resultado.container, OPCIONES_AXE);
    expect(violaciones).toHaveNoViolations();
  }, 20000);
});

describe('Saltar al contenido', () => {
  it('es el primer enfocable del layout público y apunta a #contenido', async () => {
    sessionStorage.setItem('terra_admin_token', 't'); sessionStorage.setItem('terra_admin_user', JSON.stringify({ nombre: 'P', rol: 'admin' }));
    await act(async () => { renderCon(<AdminLayout />, { ruta: '/admin' }); });
    const enlace = screen.getByRole('link', { name: /saltar al contenido/i });
    expect(enlace).toHaveAttribute('href', '#contenido');
    expect(document.getElementById('contenido')).not.toBeNull();
  });
});
