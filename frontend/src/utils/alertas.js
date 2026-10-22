import Swal from 'sweetalert2';
import '../styles/alertas.css';

/**
 * Diálogos de confirmación de eliminación con SweetAlert2.
 * Diseño: advertencia -> confirmar/cancelar -> resultado (éxito/cancelado).
 * Los estilos de los botones viven en `src/styles/alertas.css`.
 */
// Modo accesible "Más tiempo": los avisos de éxito no se cierran solos.
// Lo configura ModoAccesibleContext al cambiar el estado.
let masTiempo = false;
export function configurarAlertas({ masTiempo: valor } = {}) {
  masTiempo = Boolean(valor);
}
const opcionesTemporizador = (ms) => (masTiempo
  ? { showConfirmButton: true, confirmButtonText: 'Entendido' }
  : { timer: ms, timerProgressBar: true, showConfirmButton: false });

const swalEliminar = Swal.mixin({
  customClass: {
    container: 'terra-swal-container',
    popup: 'terra-swal',
    confirmButton: 'btn btn-success',
    cancelButton: 'btn btn-danger',
  },
  buttonsStyling: false,
});

/**
 * Pide confirmación para eliminar. Devuelve `true` si el usuario confirma.
 * Si cancela, muestra un aviso de cancelación (según el diseño solicitado).
 */
export async function confirmarEliminacion({
  titulo = '¿Estás seguro?',
  texto = 'No podrás revertir esta acción.',
} = {}) {
  const resultado = await swalEliminar.fire({
    title: titulo,
    text: texto,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'No, cancelar',
    reverseButtons: true,
    focusCancel: true,
  });

  if (resultado.isConfirmed) return true;

  if (resultado.dismiss === Swal.DismissReason.cancel) {
    await swalEliminar.fire({
      title: 'Cancelado',
      text: 'No se eliminó nada.',
      icon: 'info',
      confirmButtonText: 'Entendido',
    });
  }
  return false;
}

/** Aviso de éxito tras eliminar. */
export function avisoEliminado(texto = 'El registro fue eliminado.') {
  return swalEliminar.fire({
    title: '¡Eliminado!',
    text: texto,
    icon: 'success',
    ...opcionesTemporizador(2200),
  });
}

/** Aviso de éxito genérico (crear / actualizar). */
export function avisoExito({ titulo = '¡Listo!', texto = '' } = {}) {
  return swalEliminar.fire({
    title: titulo,
    text: texto,
    icon: 'success',
    ...opcionesTemporizador(2400),
  });
}

/** Aviso de error (por ejemplo, si la eliminación falla). */
export function avisoError(texto = 'No se pudo completar la acción.') {
  return swalEliminar.fire({
    title: 'Ocurrió un problema',
    text: texto,
    icon: 'error',
    confirmButtonText: 'Entendido',
    showCancelButton: false,
  });
}

/** Aviso informativo / advertencia sin eliminación. */
export function avisoAviso({ titulo = 'Atención', texto = '' } = {}) {
  return swalEliminar.fire({
    title: titulo,
    text: texto,
    icon: 'warning',
    confirmButtonText: 'Entendido',
    showCancelButton: false,
  });
}
