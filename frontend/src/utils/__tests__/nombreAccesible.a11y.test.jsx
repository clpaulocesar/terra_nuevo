import { describe, expect, it } from 'vitest';
import { nombreAccesible, rolLegible, textoVisible } from '../nombreAccesible.js';

function crear(html) {
  const contenedor = document.createElement('div');
  contenedor.innerHTML = html;
  document.body.appendChild(contenedor);
  return contenedor.firstElementChild;
}

describe('nombreAccesible: lo que lee la voz', () => {
  it('ignora la ligadura del icono de Material Symbols', () => {
    const chip = crear('<button class="terra-cat"><span class="material-symbols-outlined terra-cat__icon">bed</span><span class="terra-cat__label">COLCHON</span></button>');
    expect(textoVisible(chip).trim()).toBe('COLCHON');
    expect(nombreAccesible(chip)).toBe('COLCHON');
  });

  it('prefiere aria-label y lee el estado de aria-pressed', () => {
    const chip = crear('<button aria-label="Categoría COLCHON" aria-pressed="true"><span class="material-symbols-outlined">bed</span>COLCHON</button>');
    expect(nombreAccesible(chip)).toBe('Categoría COLCHON');
    expect(rolLegible(chip)).toBe('botón, activado');
  });

  it('omite lo marcado aria-hidden y usa el alt de las imágenes', () => {
    const enlace = crear('<a href="/x"><span aria-hidden="true">expand_more</span><img alt="Colchón Brisa"> Ver</a>');
    expect(nombreAccesible(enlace)).toBe('Colchón Brisa Ver');
  });
});
