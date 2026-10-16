import { useContext, useState } from 'react';
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
  const nav = useNavigate();

  if (!items.length) return <Navigate to="/carrito" replace />;

  const seguir = (event) => {
    event.preventDefault();
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
    <section className="ident-page">
      <header><Link to="/carrito"><ArrowLeft size={19} /> Volver al carrito</Link><span>Paso 2 de 3 · Identificación</span></header>
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
                      inputMode={id === 'telefono' || id === 'nit' ? 'numeric' : 'text'}
                      autoComplete={id === 'nombre' ? 'name' : id === 'telefono' ? 'tel' : 'off'}
                      onFocus={() => setActivo(id)}
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
            <button className="ident-guest" type="button" onClick={() => { limpiarCliente(); nav('/confirmacion'); }}>Continuar como invitado</button>
          </div>
          <aside><ShieldCheck size={23} /><p>Tu privacidad está protegida. Solo utilizaremos tus datos para procesar este pedido.</p></aside>
        </form>
      </div>
    </section>
  );
}
