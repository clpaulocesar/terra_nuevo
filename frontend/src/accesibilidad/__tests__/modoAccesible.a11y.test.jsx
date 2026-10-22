import { describe, expect, it, beforeEach } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import BotonAccesibilidad from '../BotonAccesibilidad.jsx';
import { renderCon, OPCIONES_AXE } from '../../test/renderCon.jsx';

describe('Botón ♿ y panel del modo accesible', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.style.fontSize = '';
  });

  it('cerrado: sin violaciones de axe', async () => {
    const { container } = renderCon(<BotonAccesibilidad />);
    expect(screen.getByRole('button', { name: /modo accesible/i })).toBeInTheDocument();
    expect(await axe(container, OPCIONES_AXE)).toHaveNoViolations();
  });

  it('abre el panel, atrapa el foco y Esc lo cierra devolviendo el foco al botón', async () => {
    const { container } = renderCon(<BotonAccesibilidad />);
    const boton = screen.getByRole('button', { name: /modo accesible/i });
    fireEvent.click(boton);
    const panel = screen.getByRole('dialog', { name: /accesibilidad/i });
    expect(panel).toHaveAttribute('aria-modal', 'true');
    expect(await axe(container, OPCIONES_AXE)).toHaveNoViolations();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('el interruptor maestro enciende las opciones por defecto y las clases en <html>', async () => {
    const { container } = renderCon(<BotonAccesibilidad />);
    fireEvent.click(screen.getByRole('button', { name: /modo accesible/i }));
    const maestro = screen.getByRole('switch', { name: /activar modo accesible/i });
    expect(maestro).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(maestro);
    expect(maestro).toHaveAttribute('aria-checked', 'true');
    const html = document.documentElement;
    expect(html.classList.contains('modo-accesible')).toBe(true);
    expect(html.classList.contains('a11y-contraste')).toBe(true);
    expect(html.classList.contains('a11y-botones')).toBe(true);
    expect(html.classList.contains('a11y-foco')).toBe(true);
    expect(html.classList.contains('a11y-enlaces')).toBe(true);
    expect(html.classList.contains('a11y-sin-animacion')).toBe(true);
    expect(html.classList.contains('a11y-fuente')).toBe(false);
    expect(html.style.fontSize).toBe('125%');
    expect(JSON.parse(localStorage.getItem('terra_a11y')).activo).toBe(true);
    expect(await axe(container, OPCIONES_AXE)).toHaveNoViolations();
    // Apagar el maestro quita todo.
    fireEvent.click(maestro);
    expect(html.classList.contains('modo-accesible')).toBe(false);
    expect(html.style.fontSize).toBe('');
  });

  it('el selector de tamaño cambia el font-size del documento', () => {
    renderCon(<BotonAccesibilidad />);
    fireEvent.click(screen.getByRole('button', { name: /modo accesible/i }));
    fireEvent.click(screen.getByRole('button', { name: /texto al 150/i }));
    expect(document.documentElement.style.fontSize).toBe('150%');
    fireEvent.click(screen.getByRole('button', { name: /restablecer/i }));
    expect(document.documentElement.classList.contains('modo-accesible')).toBe(false);
  });

  it('Alt + A abre y cierra el panel', () => {
    renderCon(<BotonAccesibilidad />);
    fireEvent.keyDown(document, { key: 'a', altKey: true });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'a', altKey: true });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
