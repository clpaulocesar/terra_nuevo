import { useContext, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Delete, ShieldCheck, UserRound } from 'lucide-react';
import { ClienteContext } from '../context/ClienteContext.jsx';
import { useCarrito } from '../hooks/useCarrito.js';
import { validarDatosCliente } from '../utils/validaciones.js';
import './Identificacion.css';

const campos = [
  ['nombre', 'Nombre y apellidos', UserRound, 'Ej: Carlos Mendoza'],
  ['telefono', 'Teléfono / WhatsApp', null, '77012345'],
  ['nit', 'NIT', null, 'Ej: 5123456'],
];

const TECLADO_LETRAS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];
const TECLADO_NUMEROS = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['0']];

export default function Identificacion() {
  const { cliente, setCliente, limpiarCliente } = useContext(ClienteContext);
  const { items } = useCarrito();
  const [datos, setDatos] = useState(cliente);
  const [errores, setErrores] = useState({});
  const [activo, setActivo] = useState('nombre');
  const [whatsapp, setWhatsapp] = useState(true);
  const [mayusculas, setMayusculas] = useState(true);
  const nav = useNavigate();

  if (!items.length) return <Navigate to="/carrito" replace />;

  const seguir = (event) => {
    event.preventDefault();
    const erroresNuevos = validarDatosCliente(datos);
    if (whatsapp && !datos.telefono.trim()) {
      erroresNuevos.telefono = 'Ingresa tu número para recibir el comprobante por WhatsApp';
    }
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

  const esNumerico = activo === 'telefono' || activo === 'nit';
  const actualizarCampo = (valor) => setDatos((anterior) => ({
    ...anterior,
    [activo]: esNumerico ? valor.replace(/\D/g, '').slice(0, 20) : valor.slice(0, 120),
  }));
  const agregarTecla = (tecla) => {
    const valor = datos[activo] || '';
    actualizarCampo(`${valor}${esNumerico ? tecla : (mayusculas ? tecla : tecla.toLowerCase())}`);
  };
  const borrarTecla = () => actualizarCampo((datos[activo] || '').slice(0, -1));
  const bloquearTecladoNativo = (event) => event.preventDefault();

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
                      inputMode="none"
                      autoComplete={id === 'nombre' ? 'name' : id === 'telefono' ? 'tel' : 'off'}
                      readOnly
                      onFocus={() => setActivo(id)}
                      onClick={() => setActivo(id)}
                      onKeyDown={bloquearTecladoNativo}
                      onPaste={bloquearTecladoNativo}
                      onDrop={bloquearTecladoNativo}
                    />
                  </div>
                  {errores[id] && <small>{errores[id]}</small>}
                </label>
              ))}
            </div>
            <section className="ident-keyboard" aria-label={`Teclado para ${campos.find(([id]) => id === activo)?.[1]}`}>
              <header>
                <span>{esNumerico ? 'Teclado numérico' : 'Teclado alfabético'}</span>
                <small>Usá este teclado para completar el campo seleccionado</small>
              </header>
              {esNumerico ? (
                <div className="ident-keyboard__numeric">
                  {TECLADO_NUMEROS.flat().map((tecla) => <button type="button" key={tecla} onClick={() => agregarTecla(tecla)}>{tecla}</button>)}
                </div>
              ) : (
                <div className="ident-keyboard__letters">
                  {TECLADO_LETRAS.map((fila) => <div key={fila.join('')}>
                    {fila.map((tecla) => <button type="button" key={tecla} onClick={() => agregarTecla(tecla)}>{mayusculas ? tecla : tecla.toLowerCase()}</button>)}
                  </div>)}
                  <div className="ident-keyboard__actions">
                    <button type="button" className={mayusculas ? 'selected' : ''} onClick={() => setMayusculas((valor) => !valor)}>Aa</button>
                    <button type="button" className="space" onClick={() => agregarTecla(' ')}>espacio</button>
                  </div>
                </div>
              )}
              <button type="button" className="ident-keyboard__delete" onClick={borrarTecla} aria-label="Borrar último carácter"><Delete size={20} /> Borrar</button>
            </section>
            <button className="ident-whatsapp" type="button" onClick={() => setWhatsapp(!whatsapp)}>
              <span>{whatsapp && <Check size={17} />}</span>
              <div><b>Deseo recibir mi comprobante por WhatsApp</b><small>Lo solicitarás al WhatsApp TERRA: 75335697</small></div>
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
