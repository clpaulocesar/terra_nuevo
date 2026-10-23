export const CLAVE_TUTORIAL = 'terra_tutorial_v1';

export function tutorialYaVisto() {
  try {
    return localStorage.getItem(CLAVE_TUTORIAL) === '1';
  } catch {
    return true;
  }
}

export function marcarTutorialVisto() {
  try {
    localStorage.setItem(CLAVE_TUTORIAL, '1');
  } catch {
    // Si el navegador bloquea el almacenamiento, el tutorial igual se puede usar.
  }
}
