import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ImagenProducto from '../ImagenProducto.jsx';
import { IMAGEN_PRODUCTO_FALLBACK } from '../../../utils/imagenProducto.js';

const ROTA = 'https://copyparty/imagens/NO-EXISTE.jpg';

describe('ImagenProducto: logo de reemplazo', () => {
  it('si la foto falla muestra el logo y mantiene el nombre del producto como alt', () => {
    render(<ImagenProducto src={ROTA} alt="SABARA" />);
    const imagen = screen.getByRole('img', { name: 'SABARA' });
    expect(imagen.getAttribute('src')).toBe(ROTA);
    expect(imagen.hasAttribute('data-reemplazo')).toBe(false);

    fireEvent.error(imagen);
    expect(imagen.getAttribute('src')).toBe(IMAGEN_PRODUCTO_FALLBACK);
    expect(imagen.hasAttribute('data-reemplazo')).toBe(true);
    expect(imagen).toHaveAccessibleName('SABARA');
  });

  it('si el logo también falla no vuelve a intentarlo', () => {
    render(<ImagenProducto src={ROTA} alt="SABARA" />);
    const imagen = screen.getByRole('img', { name: 'SABARA' });
    fireEvent.error(imagen);
    fireEvent.error(imagen);
    expect(imagen.getAttribute('src')).toBe(IMAGEN_PRODUCTO_FALLBACK);
  });

  it('sin URL muestra el logo sin intentar cargar la foto', () => {
    render(<ImagenProducto src={null} alt="Producto sin foto" />);
    const imagen = screen.getByRole('img', { name: 'Producto sin foto' });
    expect(imagen.getAttribute('src')).toBe(IMAGEN_PRODUCTO_FALLBACK);
    expect(imagen.hasAttribute('data-reemplazo')).toBe(true);
  });

  it('el texto alternativo nunca se pinta', () => {
    render(<ImagenProducto src={ROTA} alt="SABARA" className="size-full" />);
    expect(screen.getByRole('img').className).toContain('text-transparent');
  });

  it('si cambia la foto después de un fallo, vuelve a intentar con la nueva', () => {
    const { rerender } = render(<ImagenProducto src={ROTA} alt="Vista" />);
    fireEvent.error(screen.getByRole('img'));
    rerender(<ImagenProducto src="https://x/otra.jpg" alt="Vista" />);
    expect(screen.getByRole('img').getAttribute('src')).toBe('https://x/otra.jpg');
  });
});
