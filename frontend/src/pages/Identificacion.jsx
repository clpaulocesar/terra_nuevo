import { useContext, useState, useEffect, useRef } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ShieldCheck, UserRound } from 'lucide-react';
import { ClienteContext } from '../context/ClienteContext.jsx';
import { useCarrito } from '../hooks/useCarrito.js';
import { validarDatosCliente } from '../utils/validaciones.js';
import './Identificacion.css';

const campos = [
  ['nombre', 'Nombre y apellidos', UserRound, 'Ej: Carlos Mendoza'],
  ['telefono', 'Teléfono / WhatsApp', null, '77012345'],
  ['nit', 'NIT', null, 'Ej: 5123456'],
];

export default function Identificacion() {
  const { cliente, setCliente, limpiarCliente } = useContext(ClienteContext);
  const { items } = useCarrito();
  const [datos, setDatos] = useState(cliente);
  const [errores, setErrores] = useState({});
  const [activo, setActivo] = useState('nombre');
  const [whatsapp, setWhatsapp] = useState(true);
  const [tecladoAbierto, setTecladoAbierto] = useState(false);
  const [esTactil, setEsTactil] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  );
  const [campoActivo, setCampoActivo] = useState(null);
  const [modoNumerico, setModoNumerico] = useState(false);
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
          cerrarTeclado();
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [tecladoAbierto, esTactil]);

  if (!items.length) return <Navigate to="/carrito" replace />;

  const agregarCaracter = (caracter) => {
    if (!campoActivo) return;
    setDatos((anterior) => ({ ...anterior, [campoActivo]: anterior[campoActivo] + caracter }));
  };

  const alternarModoNumerico = () => {
    setModoNumerico((prev) => !prev);
  };

  const borrarCaracter = () => {
    if (!campoActivo) return;
    setDatos((anterior) => {
      const valor = anterior[campoActivo];
      return { ...anterior, [campoActivo]: valor.slice(0, -1) };
    });
  };

  const limpiarCampo = () => {
    if (!campoActivo) return;
    setDatos((anterior) => ({ ...anterior, [campoActivo]: '' }));
  };

  const abrirTeclado = (id) => {
    setCampoActivo(id);
    if (esTactil) setTecladoAbierto(true);
  };

  const cerrarTeclado = () => {
    setTecladoAbierto(false);
    setCampoActivo(null);
  };

  const seguir = (event) => {
    event.preventDefault();
    cerrarTeclado();
    const erroresNuevos = validarDatosCliente(datos);
    setErrores(erroresNuevos);
    if (Object.keys(erroresNuevos).length) return;

    setCliente({
      ...datos,
      nombre: datos.nombre.trim(),
      telefono: datos.telefono.trim(),
      nit: datos.nit.trim(),
      whatsapp,
    });
    nav('/confirmacion');
  };

  return (
    <section className="ident-page" style={{ paddingBottom: tecladoAbierto && esTactil ? 320 : 0 }}>
      <header><Link to="/carrito"><ArrowLeft size={19} /> Volver al carrito</Link></header>
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
                      inputMode={esTactil ? 'none' : id === 'telefono' || id === 'nit' ? 'numeric' : 'text'}
                      autoComplete={id === 'nombre' ? 'name' : id === 'telefono' ? 'tel' : 'off'}
                      readOnly={esTactil}
                      onFocus={() => { setActivo(id); abrirTeclado(id); }}
                      onChange={(event) => setDatos((anterior) => ({
                        ...anterior,
                        [id]: id === 'nit' ? event.target.value.replace(/\D/g, '').slice(0, 20) : event.target.value,
                      }))}
                    />
                  </div>
                  {errores[id] && <small>{errores[id]}</small>}
                </label>
              ))}
            </div>
            <button className="ident-whatsapp" type="button" onClick={() => setWhatsapp(!whatsapp)}>
              <span>{whatsapp && <Check size={17} />}</span>
              <div><b>Deseo recibir mi comprobante por WhatsApp</b><small>Notificación instantánea con link de seguimiento</small></div>
            </button>
            <button className="ident-next" type="submit">Continuar a confirmación <ArrowRight size={20} /></button>
            <button className="ident-guest" type="button" onClick={() => { cerrarTeclado(); limpiarCliente(); nav('/confirmacion'); }}>Continuar como invitado</button>
          </div>
          <aside><ShieldCheck size={23} /><p>Tu privacidad está protegida. Solo utilizaremos tus datos para procesar este pedido.</p></aside>
        </form>
        {esTactil && tecladoAbierto && (
          <div className="ident-teclado" ref={tecladoRef}>
            <div className="ident-teclado__header">
              <span className="ident-teclado__title">Teclado Táctil TERRA</span>
              <button type="button" onClick={cerrarTeclado} className="ident-btn-ghost-sm">
                Cerrar teclado
              </button>
            </div>
            {[
              ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
              ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
              ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
            ].map((row, i) => (
              <div key={i} className="ident-teclado__row">
                {row.map((letra) => (
                  <button key={letra} type="button" onClick={() => agregarCaracter(letra)} className="ident-key">
                    {letra}
                  </button>
                ))}
                {i === 2 && (
                  <button type="button" onClick={borrarCaracter} className="ident-key ident-key--delete">
                    <span className="material-symbols-outlined">backspace</span>
                  </button>
                )}
              </div>
            ))}
            <div className="ident-teclado__row ident-teclado__row--wide">
              <button type="button" onClick={alternarModoNumerico} className="ident-key ident-key--mode">
                {modoNumerico ? 'ABC' : '123'}
              </button>
              <button type="button" onClick={() => agregarCaracter(' ')} className="ident-key ident-key--space">
                Espacio
              </button>
              <button type="button" onClick={limpiarCampo} className="ident-key ident-key--clear">
                Limpiar
              </button>
            </div>
            {!modoNumerico ? null : (
              <div className="ident-teclado__row">
                {['1', '2', '3'].map((n) => (
                  <button key={n} type="button" onClick={() => agregarCaracter(n)} className="ident-key">
                    {n}
                  </button>
                ))}
                {['4', '5', '6'].map((n) => (
                  <button key={n} type="button" onClick={() => agregarCaracter(n)} className="ident-key">
                    {n}
                  </button>
                ))}
                {['7', '8', '9'].map((n) => (
                  <button key={n} type="button" onClick={() => agregarCaracter(n)} className="ident-key">
                    {n}
                  </button>
                ))}
                {['0'].map((n) => (
                  <button key={n} type="button" onClick={() => agregarCaracter(n)} className="ident-key">
                    {n}
                  </button>
                ))}
                {['+'].map((s) => (
                  <button key={s} type="button" onClick={() => agregarCaracter(s)} className="ident-key">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
