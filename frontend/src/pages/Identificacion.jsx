import { useContext, useState, useEffect, useRef } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  MapPin,
  Navigation,
  Package,
  PackageCheck,
  ShieldCheck,
  Store,
  Truck,
  UserRound,
} from 'lucide-react';
import { ClienteContext } from '../context/ClienteContext.jsx';
import { SesionClienteContext } from '../context/SesionClienteContext.jsx';
import { useCarrito } from '../hooks/useCarrito.js';
import { validarDatosCliente } from '../utils/validaciones.js';
import { formatoMoneda } from '../utils/formatoMoneda.js';
import './Identificacion.css';
import TecladoTactil from '../components/ui/TecladoTactil.jsx';

const campos = [
  ['nombre', 'Nombre y apellidos', UserRound, 'Ej: Carlos Mendoza'],
  ['telefono', 'Teléfono de contacto', null, '77012345'],
  ['nit', 'NIT', null, 'Ej: 5123456'],
];

const CAMPOS_NUMERICOS = new Set(['telefono', 'nit']);

function normalizarValorCampo(campo, valor) {
  if (!CAMPOS_NUMERICOS.has(campo)) return valor;
  let digitos = String(valor || '').replace(/\D/g, '');
  if (campo === 'telefono' && digitos.startsWith('591') && digitos.length > 8) digitos = digitos.slice(3);
  return digitos.slice(0, campo === 'telefono' ? 8 : 20);
}

export default function Identificacion() {
  const { cliente, setCliente, limpiarCliente } = useContext(ClienteContext);
  const { esMayorista } = useContext(SesionClienteContext);
  const { items } = useCarrito();
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
    if (Array.isArray(guardados) && guardados.length) return new Set(guardados);
    return new Set(items.map((it) => String(it.lineaId || it.id)));
  });
  const [errores, setErrores] = useState({});
  const [activo, setActivo] = useState('nombre');
  const [tecladoAbierto, setTecladoAbierto] = useState(false);
  const [esTactil, setEsTactil] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  );
  const [campoActivo, setCampoActivo] = useState(null);
  const tecladoRef = useRef(null);
  const nav = useNavigate();

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(pointer: coarse)');
    const actualizar = (e) => setEsTactil(e.matches);
    mq.addEventListener('change', actualizar);
    return () => mq.removeEventListener('change', actualizar);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!tecladoAbierto || !esTactil) return;
      if (tecladoRef.current && !tecladoRef.current.contains(event.target)) {
        if (!event.target.closest('input')) {
          setTecladoAbierto(false);
          setCampoActivo(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [tecladoAbierto, esTactil]);

  if (esMayorista) return <Navigate to="/confirmacion" replace />;
  if (!items.length) return <Navigate to="/carrito" replace />;

  const agregarCaracter = (caracter) => {
    if (!campoActivo) return;
    setDatos((anterior) => ({
      ...anterior,
      [campoActivo]: normalizarValorCampo(campoActivo, (anterior[campoActivo] || '') + caracter),
    }));
  };

  const borrarCaracter = () => {
    if (!campoActivo) return;
    setDatos((anterior) => {
      const valor = anterior[campoActivo] || '';
      return { ...anterior, [campoActivo]: valor.slice(0, -1) };
    });
  };

  const abrirTeclado = (id) => {
    setCampoActivo(id);
    if (esTactil) setTecladoAbierto(true);
  };

  const cerrarTeclado = () => {
    setTecladoAbierto(false);
    setCampoActivo(null);
  };

  const alternarItemEnvio = (itemId) => {
    setItemsEnvio((ant) => {
      const nuevo = new Set(ant);
      const clave = String(itemId);
      if (nuevo.has(clave)) {
        nuevo.delete(clave);
      } else {
        nuevo.add(clave);
      }
      return nuevo;
    });
  };

  const marcarTodosEnvio = () => {
    setItemsEnvio(new Set(items.map((it) => String(it.lineaId || it.id))));
  };

  const seguir = (event) => {
    event.preventDefault();
    cerrarTeclado();
    const datosValidados = {
      ...datos,
      entregaDomicilio,
    };
    const erroresNuevos = validarDatosCliente(datosValidados);
    setErrores(erroresNuevos);
    if (Object.keys(erroresNuevos).length) return;

    setCliente({
      nombre: datos.nombre.trim(),
      telefono: datos.telefono.trim(),
      nit: datos.nit.trim(),
      entregaDomicilio,
      direccion: entregaDomicilio ? (datos.direccion || '').trim() : '',
      referencia: entregaDomicilio ? (datos.referencia || '').trim() : '',
      itemsEnvio: entregaDomicilio ? Array.from(itemsEnvio) : [],
    });
    nav('/confirmacion');
  };

  return (
    <section className="ident-page" style={{ paddingBottom: tecladoAbierto && esTactil ? 'clamp(20rem, 40vh, 26rem)' : 0 }}>
      <header>
        <Link to="/carrito"><ArrowLeft size={19} /> Volver al carrito</Link>
      </header>
      <h1>Datos para tu pedido en tienda</h1>
      <p className="ident-lead">Ingresá tus datos para asociar el ticket y llamarte en caja o coordinar el despacho.</p>
      <div className="ident-layout">
        <form onSubmit={seguir}>
          <div className="ident-card">
            <div className="ident-fields">
              {campos.map(([id, etiqueta, Icono, placeholder]) => (
                <label className={`ident-field-${id}${activo === id ? ' active' : ''}`} key={id}>
                  <span>
                    {Icono && <Icono size={18} />} {etiqueta}
                    {id === 'nombre' && <b>*</b>}
                    {(id === 'telefono' || id === 'nit') && <em>Opcional</em>}
                  </span>
                  <div>
                    {id === 'telefono' && <i>+591</i>}
                    <input
                      value={datos[id]}
                      placeholder={placeholder}
                      type={id === 'telefono' ? 'tel' : 'text'}
                      inputMode={esTactil ? 'none' : id === 'telefono' || id === 'nit' ? 'numeric' : 'text'}
                      pattern={CAMPOS_NUMERICOS.has(id) ? '[0-9]*' : undefined}
                      maxLength={id === 'telefono' ? 8 : id === 'nit' ? 20 : 120}
                      autoComplete={id === 'nombre' ? 'name' : id === 'telefono' ? 'tel' : 'off'}
                      readOnly={esTactil}
                      onFocus={() => { setActivo(id); abrirTeclado(id); }}
                      onChange={(event) => setDatos((anterior) => ({
                        ...anterior,
                        [id]: normalizarValorCampo(id, event.target.value),
                      }))}
                    />
                  </div>
                  {errores[id] && <small>{errores[id]}</small>}
                </label>
              ))}
            </div>

            {/* Modalidad de entrega: Retiro en tienda o Envío a domicilio */}
            <section className="ident-delivery-choice" aria-labelledby="ident-delivery-title">
              <span id="ident-delivery-title" className="ident-delivery-title">
                <Truck size={18} /> ¿Deseás envío a domicilio?
              </span>
              <div className="ident-delivery-options" role="radiogroup" aria-label="Modalidad de entrega">
                <button
                  type="button"
                  role="radio"
                  aria-checked={!entregaDomicilio}
                  className={`ident-delivery-btn ${!entregaDomicilio ? 'is-selected' : ''}`}
                  onClick={() => {
                    setEntregaDomicilio(false);
                    setErrores((ant) => { const n = { ...ant }; delete n.direccion; return n; });
                  }}
                >
                  <Store size={20} />
                  <div>
                    <b>No, retiro en tienda</b>
                    <small>Pagás y retirás en mostrador</small>
                  </div>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={entregaDomicilio}
                  className={`ident-delivery-btn ${entregaDomicilio ? 'is-selected' : ''}`}
                  onClick={() => {
                    setEntregaDomicilio(true);
                    setActivo('direccion');
                    abrirTeclado('direccion');
                  }}
                >
                  <Truck size={20} />
                  <div>
                    <b>Sí, envío a domicilio</b>
                    <small>Despacho directo a tu puerta</small>
                  </div>
                </button>
              </div>

              {entregaDomicilio && (
                <div className="ident-delivery-fields">
                  <label className={`ident-field-direccion${activo === 'direccion' ? ' active' : ''}`}>
                    <span>
                      <MapPin size={17} /> Dirección de entrega <b>*</b>
                    </span>
                    <div>
                      <input
                        value={datos.direccion || ''}
                        placeholder="Calle, avenida, número y barrio o zona"
                        type="text"
                        readOnly={esTactil}
                        autoComplete="street-address"
                        onFocus={() => { setActivo('direccion'); abrirTeclado('direccion'); }}
                        onChange={(event) => setDatos((ant) => ({ ...ant, direccion: event.target.value }))}
                      />
                    </div>
                    {errores.direccion && <small>{errores.direccion}</small>}
                  </label>

                  <label className={`ident-field-referencia${activo === 'referencia' ? ' active' : ''}`}>
                    <span>
                      <Navigation size={17} /> Referencia del domicilio <em>Opcional</em>
                    </span>
                    <div>
                      <input
                        value={datos.referencia || ''}
                        placeholder="Ej: Portón café, frente a farmacia, timbre 2B"
                        type="text"
                        readOnly={esTactil}
                        onFocus={() => { setActivo('referencia'); abrirTeclado('referencia'); }}
                        onChange={(event) => setDatos((ant) => ({ ...ant, referencia: event.target.value }))}
                      />
                    </div>
                  </label>

                  {/* Selección de productos para envío a domicilio */}
                  <div className="ident-delivery-items-wrap">
                    <div className="ident-delivery-items-header">
                      <div>
                        <b><PackageCheck size={17} /> ¿Qué productos deseas enviar a domicilio?</b>
                        <small>Tocá un producto para alternar entre envío a domicilio y retiro en tienda.</small>
                      </div>
                      <button
                        type="button"
                        className="ident-delivery-btn-all"
                        onClick={marcarTodosEnvio}
                      >
                        <Check size={14} /> Enviar todos
                      </button>
                    </div>

                    <div className="ident-delivery-items-grid" role="group" aria-label="Productos para envío o retiro">
                      {items.map((item) => {
                        const itemId = String(item.lineaId || item.id);
                        const esEnvio = itemsEnvio.has(itemId);
                        return (
                          <article
                            key={itemId}
                            className={`ident-delivery-item-card ${esEnvio ? 'is-delivery' : 'is-pickup'}`}
                            onClick={() => alternarItemEnvio(itemId)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                alternarItemEnvio(itemId);
                              }
                            }}
                            aria-label={`${item.nombre}, ${esEnvio ? 'marcado para envío a domicilio' : 'marcado para retiro en tienda'}. Tocar para cambiar.`}
                          >
                            <div className="ident-delivery-item-thumb">
                              {item.imagen_url ? (
                                <img src={item.imagen_url} alt="" />
                              ) : (
                                <Package size={20} />
                              )}
                            </div>
                            <div className="ident-delivery-item-info">
                              <strong>{item.nombre}</strong>
                              <span>{item.cantidad} × {formatoMoneda(item.precio)}{item.color?.nombre ? ` · ${item.color.nombre}` : ''}</span>
                            </div>
                            <div className="ident-delivery-item-badge">
                              {esEnvio ? (
                                <span className="pill-delivery">
                                  <Truck size={13} /> Envío
                                </span>
                              ) : (
                                <span className="pill-pickup">
                                  <Store size={13} /> Retiro
                                </span>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>

                    <div className="ident-delivery-counter">
                      <span>🚚 <b>{itemsEnvio.size}</b> para envío a domicilio</span>
                      <span>·</span>
                      <span>🛍️ <b>{items.length - itemsEnvio.size}</b> para retiro en mostrador</span>
                    </div>
                  </div>
                </div>
              )}
            </section>

            <button className="ident-next" type="submit">Continuar a confirmación <ArrowRight size={20} /></button>
            <button className="ident-guest" type="button" onClick={() => { cerrarTeclado(); limpiarCliente(); nav('/confirmacion'); }}>Continuar como invitado</button>
          </div>
          <aside><ShieldCheck size={23} /><p>Tu privacidad está protegida. Solo utilizaremos tus datos para procesar este pedido.</p></aside>
        </form>
      </div>
      {esTactil && tecladoAbierto && (
        <TecladoTactil
          key={CAMPOS_NUMERICOS.has(campoActivo) ? 'numerico' : 'texto'}
          ref={tecladoRef}
          onCaracter={agregarCaracter}
          onBorrar={borrarCaracter}
          onCerrar={cerrarTeclado}
          onPegar={agregarCaracter}
          valorActual={campoActivo ? (datos[campoActivo] || '') : ''}
          modo={CAMPOS_NUMERICOS.has(campoActivo) ? 'numerico' : 'texto'}
        />
      )}
    </section>
  );
}
