import { useContext, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, Navigation, UserRound } from 'lucide-react';
import { ClienteContext } from '../../context/ClienteContext.jsx';
import { SesionClienteContext } from '../../context/SesionClienteContext.jsx';
import { useCarrito } from '../../hooks/useCarrito.js';
import TecladoTactil from '../../components/ui/TecladoTactil.jsx';
import EnlaceVolver from '../../components/ui/EnlaceVolver.jsx';
import { BOTON_PRINCIPAL, BOTON_SECUNDARIO, TARJETA_COMPRA } from '../compra/estilosCompra.js';
import { CAMPOS_NUMERICOS } from './utils/camposIdentificacion.js';
import { useTecladoTactil } from './hooks/useTecladoTactil.js';
import { useFormularioIdentificacion } from './hooks/useFormularioIdentificacion.js';
import CampoIdentificacion from './components/CampoIdentificacion.jsx';
import ModalidadEntrega from './components/ModalidadEntrega.jsx';
import SeleccionEnvio from './components/SeleccionEnvio.jsx';
import NotaPrivacidad from './components/NotaPrivacidad.jsx';

const CAMPOS_CLIENTE = [
  {
    id: 'nombre', etiqueta: 'Nombre y apellidos', icono: UserRound, placeholder: 'Ej: Carlos Mendoza',
    marca: 'obligatorio', autoComplete: 'name', maxLength: 120, className: 'sm:col-span-2',
  },
  {
    id: 'telefono', etiqueta: 'Teléfono de contacto', placeholder: '77012345', marca: 'opcional', prefijo: '+591',
    type: 'tel', autoComplete: 'tel', maxLength: 8,
  },
  { id: 'nit', etiqueta: 'NIT', placeholder: 'Ej: 5123456', marca: 'opcional', autoComplete: 'off', maxLength: 20 },
];

// data-pagina: gancho de la variante en-identificacion (oculta el carrito flotante).
export default function IdentificacionPage() {
  const { cliente, setCliente, limpiarCliente } = useContext(ClienteContext);
  const { esMayorista } = useContext(SesionClienteContext);
  const { items } = useCarrito();
  const formulario = useFormularioIdentificacion(cliente, items);
  const teclado = useTecladoTactil();
  const { tecladoRef } = teclado;
  const [activo, setActivo] = useState('nombre');
  const navegar = useNavigate();

  if (esMayorista) return <Navigate to="/confirmacion" replace />;
  if (!items.length) return <Navigate to="/carrito" replace />;

  const enfocarCampo = (campo) => {
    setActivo(campo);
    teclado.abrirTeclado(campo);
  };

  const propsCampo = (campo) => ({
    value: formulario.datos[campo] || '',
    readOnly: teclado.esTactil,
    activo: activo === campo,
    error: formulario.errores[campo],
    onFocus: () => enfocarCampo(campo),
    onChange: (event) => formulario.cambiarCampo(campo, event.target.value),
  });

  const elegirEnvio = () => {
    formulario.elegirEnvio();
    enfocarCampo('direccion');
  };

  const continuar = (event) => {
    event.preventDefault();
    teclado.cerrarTeclado();
    const datosCliente = formulario.validar();
    if (!datosCliente) return;
    setCliente(datosCliente);
    navegar('/confirmacion');
  };

  const continuarComoInvitado = () => {
    teclado.cerrarTeclado();
    limpiarCliente();
    navegar('/confirmacion');
  };

  const campoTeclado = teclado.campoActivo;
  const modoTeclado = CAMPOS_NUMERICOS.has(campoTeclado) ? 'numerico' : 'texto';

  return (
    <section
      data-pagina="identificacion"
      className={`mx-auto max-w-270 ${teclado.tecladoVisible ? 'pb-[clamp(20rem,40vh,26rem)]' : ''}`}
    >
      <header className="flex items-center gap-4">
        <EnlaceVolver to="/carrito">Volver al carrito</EnlaceVolver>
      </header>
      <h1
        className="mt-2 mb-0.5 text-center text-terra-titulo-movil leading-[1.12] font-black tracking-terra-titulo
          text-terra-texto sm:text-terra-titulo"
      >
        Datos para tu pedido en tienda
      </h1>
      <p className="mx-auto my-0 max-w-140 text-center text-base text-terra-texto-suave">
        Ingresa tus datos para asociar el ticket y llamarte en caja o coordinar el despacho.
      </p>
      <form
        onSubmit={continuar}
        className="mx-auto mt-3.5 max-w-190 md:max-w-[min(47.5rem,var(--container-terra-sin-flotantes))]"
      >
        <div className={`${TARJETA_COMPRA} p-4 sm:p-5.5`}>
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            {CAMPOS_CLIENTE.map(({ id, ...campo }) => (
              <CampoIdentificacion
                key={id}
                {...campo}
                {...propsCampo(id)}
                inputMode={teclado.esTactil ? 'none' : CAMPOS_NUMERICOS.has(id) ? 'numeric' : 'text'}
                pattern={CAMPOS_NUMERICOS.has(id) ? '[0-9]*' : undefined}
              />
            ))}
          </div>

          <ModalidadEntrega
            entregaDomicilio={formulario.entregaDomicilio}
            onElegirRetiro={formulario.elegirRetiro}
            onElegirEnvio={elegirEnvio}
          >
            <CampoIdentificacion
              etiqueta="Dirección de entrega"
              icono={MapPin}
              marca="obligatorio"
              placeholder="Calle, avenida, número y barrio o zona"
              autoComplete="street-address"
              {...propsCampo('direccion')}
            />
            <CampoIdentificacion
              etiqueta="Referencia del domicilio"
              icono={Navigation}
              marca="opcional"
              placeholder="Ej: Portón café, frente a farmacia, timbre 2B"
              {...propsCampo('referencia')}
            />
            <p className="m-0">El costo de envío será definido por la vendedora en caja antes de cobrar.</p>
            <SeleccionEnvio
              items={items}
              itemsEnvio={formulario.itemsEnvio}
              onAlternar={formulario.alternarItemEnvio}
              onMarcarTodos={formulario.marcarTodosEnvio}
            />
          </ModalidadEntrega>

          <button
            className={`${BOTON_PRINCIPAL} mt-4`}
            type="submit"
          >
            Continuar a confirmación
            <ArrowRight size={20} />
          </button>
          <button
            className={`${BOTON_SECUNDARIO} mt-4`}
            type="button"
            onClick={continuarComoInvitado}
          >
            Continuar como invitado
          </button>
        </div>
        <NotaPrivacidad />
      </form>
      {teclado.tecladoVisible && (
        <TecladoTactil
          key={modoTeclado}
          ref={tecladoRef}
          onCaracter={(caracter) => campoTeclado && formulario.agregarCaracter(campoTeclado, caracter)}
          onBorrar={() => campoTeclado && formulario.borrarCaracter(campoTeclado)}
          onCerrar={teclado.cerrarTeclado}
          onPegar={(texto) => campoTeclado && formulario.agregarCaracter(campoTeclado, texto)}
          valorActual={campoTeclado ? (formulario.datos[campoTeclado] || '') : ''}
          modo={modoTeclado}
        />
      )}
    </section>
  );
}
