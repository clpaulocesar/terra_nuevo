// Configuración de vitest (jsdom) para los tests de accesibilidad.
import '@testing-library/jest-dom/vitest';
import { afterEach, expect, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);
// Sin `globals: true`, Testing Library no desmonta sola entre tests.
afterEach(() => cleanup());

// jsdom no implementa estas APIs del navegador que usa la app.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false, media: query, onchange: null,
    addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
  });
}
if (!window.IntersectionObserver) {
  window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } };
}
if (!window.ResizeObserver) {
  window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
}
if (!window.scrollTo) window.scrollTo = () => {};
Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || (() => {});
// Sin speechSynthesis ni SpeechRecognition: la app oculta las opciones de voz.

// Toda llamada a la API devuelve una respuesta vacía pero válida.
globalThis.fetch = vi.fn(async () => ({
  ok: true,
  status: 200,
  headers: { get: () => 'application/json' },
  json: async () => ({ success: true, data: [], paginacion: { total: 0, totalPaginas: 1, pagina: 1, limite: 18 } }),
  text: async () => '',
}));
