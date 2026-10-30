import { useState } from 'react';
import { validarDatosCliente } from '../../../utils/validaciones.js';
import { idLinea } from '../../carrito/utils/nombreLinea.js';
import { normalizarValorCampo } from '../utils/camposIdentificacion.js';

const idsDe = (items) => new Set(items.map((item) => String(idLinea(item))));

// Datos del cliente, modalidad de entrega y productos marcados para envío. Arranca con lo
// que ya había en ClienteContext (al volver desde Confirmación) y, si no, todo a domicilio.
export function useFormularioIdentificacion(cliente, items) {
  const [datos, setDatos] = useState(() => ({
    nombre: cliente?.nombre || '',
    telefono: cliente?.telefono || '',
    nit: cliente?.nit || '',
    direccion: cliente?.direccion || '',
    referencia: cliente?.referencia || '',
  }));
  const [entregaDomicilio, setEntregaDomicilio] = useState(() => Boolean(cliente?.entregaDomicilio));
  const [itemsEnvio, setItemsEnvio] = useState(() => {
    const guardados = cliente?.itemsEnvio;
    return Array.isArray(guardados) && guardados.length ? new Set(guardados) : idsDe(items);
  });
  const [errores, setErrores] = useState({});

  const cambiarCampo = (campo, valor) => {
    setDatos((anterior) => ({ ...anterior, [campo]: normalizarValorCampo(campo, valor) }));
  };

  const agregarCaracter = (campo, caracter) => {
    setDatos((anterior) => ({
      ...anterior,
      [campo]: normalizarValorCampo(campo, (anterior[campo] || '') + caracter),
    }));
  };

  const borrarCaracter = (campo) => {
    setDatos((anterior) => ({ ...anterior, [campo]: (anterior[campo] || '').slice(0, -1) }));
  };

  const elegirRetiro = () => {
    setEntregaDomicilio(false);
    setErrores((anterior) => {
      const siguientes = { ...anterior };
      delete siguientes.direccion;
      return siguientes;
    });
  };

  const alternarItemEnvio = (id) => {
    setItemsEnvio((anterior) => {
      const nuevo = new Set(anterior);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });
  };

  const marcarTodosEnvio = () => setItemsEnvio(idsDe(items));

  // Devuelve los datos listos para ClienteContext, o null si hay errores (quedan en `errores`).
  const validar = () => {
    const erroresNuevos = validarDatosCliente({ ...datos, entregaDomicilio });
    setErrores(erroresNuevos);
    if (Object.keys(erroresNuevos).length) return null;
    return {
      nombre: datos.nombre.trim(),
      telefono: datos.telefono.trim(),
      nit: datos.nit.trim(),
      entregaDomicilio,
      direccion: entregaDomicilio ? (datos.direccion || '').trim() : '',
      referencia: entregaDomicilio ? (datos.referencia || '').trim() : '',
      zonaEnvioId: '',
      itemsEnvio: entregaDomicilio ? Array.from(itemsEnvio) : [],
    };
  };

  return {
    datos,
    errores,
    entregaDomicilio,
    itemsEnvio,
    cambiarCampo,
    agregarCaracter,
    borrarCaracter,
    elegirRetiro,
    elegirEnvio: () => setEntregaDomicilio(true),
    alternarItemEnvio,
    marcarTodosEnvio,
    validar,
  };
}
