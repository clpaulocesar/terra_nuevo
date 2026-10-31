import { useCallback, useEffect, useRef } from 'react';
import { marcarTutorialVisto } from './almacenamiento.js';
import { construirPasosTutorial } from './pasosTutorial.js';

function esVisible(elemento) {
  if (!elemento) return false;
  const rectangulo = elemento.getBoundingClientRect();
  const estilos = window.getComputedStyle(elemento);
  return rectangulo.width > 0
    && rectangulo.height > 0
    && estilos.display !== 'none'
    && estilos.visibility !== 'hidden';
}

function resolverElemento(selectores) {
  for (const selector of selectores) {
    for (const elemento of document.querySelectorAll(selector)) {
      if (esVisible(elemento)) return elemento;
    }
  }
  return null;
}

export function useTutorialGuiado({ esMayorista = false, alFinalizar } = {}) {
  const driverRef = useRef(null);
  const focoPrevioRef = useRef(null);
  const alFinalizarRef = useRef(alFinalizar);

  useEffect(() => {
    alFinalizarRef.current = alFinalizar;
  }, [alFinalizar]);

  useEffect(() => () => {
    if (driverRef.current) {
      driverRef.current.destroy();
      driverRef.current = null;
    }
  }, []);

  const iniciarTutorial = useCallback(async () => {
    if (driverRef.current) {
      driverRef.current.destroy();
      driverRef.current = null;
    }

    const esMovil = window.matchMedia('(max-width: 640px)').matches;
    const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pasos = construirPasosTutorial({ esMovil, esMayorista });
    const [{ driver }] = await Promise.all([
      import('driver.js'),
      import('driver.js/dist/driver.css'),
      import('./tutorial.css'),
    ]);

    focoPrevioRef.current = document.activeElement;
    document.documentElement.classList.add('terra-tour-activo');

    let tour;
    const cerrarConEscape = (evento) => {
      if (evento.key === 'Escape') tour?.destroy();
    };

    const pasosDriver = pasos.map((paso) => ({
      element: () => resolverElemento(paso.selectores),
      skipMissingElement: true,
      waitForElement: 2500,
      popover: {
        title: paso.titulo,
        description: paso.descripcion,
        side: paso.lado,
        align: 'center',
      },
    }));

    tour = driver({
      steps: pasosDriver,
      popoverClass: `terra-tour-popover${esMovil ? ' terra-tour-popover--movil' : ''}`,
      showProgress: true,
      progressText: '{{current}} de {{total}}',
      nextBtnText: 'Siguiente',
      prevBtnText: 'Anterior',
      doneBtnText: 'Finalizar',
      showButtons: ['previous', 'next'],
      animate: !reducirMovimiento,
      duration: 300,
      overlayColor: '#160f0e',
      overlayOpacity: 0.72,
      stagePadding: 6,
      stageRadius: 12,
      popoverOffset: 10,
      smoothScroll: true,
      allowClose: true,
      overlayClickBehavior: 'none',
      skipMissingElement: true,
      onPopoverRender: (popover) => {
        const salir = document.createElement('button');
        salir.type = 'button';
        salir.className = 'driver-popover-footer-btn terra-tour-salir';
        salir.textContent = 'Salir';
        salir.addEventListener('click', () => tour.destroy());
        popover.footerButtons.prepend(salir);
      },
      onDestroyed: () => {
        document.removeEventListener('keydown', cerrarConEscape);
        document.documentElement.classList.remove('terra-tour-activo');
        marcarTutorialVisto();
        driverRef.current = null;
        const focoPrevio = focoPrevioRef.current;
        const focoUtil = focoPrevio instanceof HTMLElement
          && focoPrevio.isConnected
          && focoPrevio !== document.body
          && focoPrevio !== document.documentElement;
        const destino = focoUtil
          ? focoPrevio
          : Array.from(document.querySelectorAll('[data-tour="tutorial"]')).find(esVisible);
        if (destino) {
          window.setTimeout(() => {
            if (destino.isConnected) destino.focus();
          }, 60);
        }
        alFinalizarRef.current?.();
      },
    });

    driverRef.current = tour;
    document.addEventListener('keydown', cerrarConEscape);
    tour.drive();
  }, [esMayorista]);

  return iniciarTutorial;
}
