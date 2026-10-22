import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Mail,
  MapPin,
  PackageCheck,
  Pencil,
  RefreshCw,
  Search,
  Truck,
  UserRound,
  X,
} from 'lucide-react';
import { actualizarPersonal, listarRepartidores } from '../../services/personalService.js';
import { asignarRepartidorPedido, listarPedidos } from '../../services/pedidoService.js';
import { formatoMoneda } from '../../utils/formatoMoneda.js';
import './RepartidoresAdmin.css';

const CANCELADOS = ['cancelled', 'cancelado'];

function formatoFecha(fecha) {
  if (!fecha) return '—';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    hour12: false, timeZone: 'America/La_Paz',
  }).format(d);
}

function etapaDe(pedido) {
  const etapa = String(pedido?.estado_entrega || '').toLowerCase();
  if (etapa === 'entregado') return 'entregado';
  if (etapa === 'en_camino') return 'en_camino';
  return 'pendiente';
}

const VACIO = { nombre: '', vehiculo: '', placa: '', activo: true };

export default function RepartidoresAdmin() {
  const [repartidores, setRepartidores] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState(null);
  const [buscar, setBuscar] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [editando, setEditando] = useState(null);
  const [formulario, setFormulario] = useState(VACIO);
  const [guardando, setGuardando] = useState('');
  const [seleccion, setSeleccion] = useState({});
  const primeraCarga = useRef(true);

  const cargar = useCallback(async ({ silencioso = false } = {}) => {
    if (!primeraCarga.current) {
      if (!silencioso) setCargando(true);
      setError('');
    }
    try {
      const [equipo, lista] = await Promise.all([
        listarRepartidores(),
        listarPedidos({ entrega: 'domicilio', limite: 200 }),
      ]);
      setRepartidores(Array.isArray(equipo) ? equipo : []);
      setPedidos((Array.isArray(lista) ? lista : []).filter(
        (pedido) => !CANCELADOS.includes(String(pedido.estado || '').toLowerCase())
      ));
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los repartidores.');
    } finally {
      primeraCarga.current = false;
      setCargando(false);
    }
  }, []);

  // oxlint-disable-next-line react/set-state-in-effect
  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    if (!aviso) return undefined;
    const limpia = setTimeout(() => setAviso(null), 4500);
    return () => clearTimeout(limpia);
  }, [aviso]);

  useEffect(() => {
    if (!editando) return undefined;
    const alEscape = (evento) => { if (evento.key === 'Escape' && !guardando) setEditando(null); };
    document.addEventListener('keydown', alEscape);
    return () => document.removeEventListener('keydown', alEscape);
  }, [editando, guardando]);

  const abrirEdicion = (repartidor) => {
    setEditando(repartidor);
    setFormulario({
      nombre: repartidor.nombre || '',
      vehiculo: repartidor.vehiculo || '',
      placa: repartidor.placa || '',
      activo: repartidor.activo !== false,
    });
  };

  const guardarRepartidor = async (evento) => {
    evento.preventDefault();
    if (!editando) return;
    setGuardando(String(editando.id));
    setAviso(null);
    try {
      const actualizado = await actualizarPersonal(editando.id, formulario);
      setRepartidores((lista) => lista.map((r) => (r.id === actualizado.id ? actualizado : r)));
      setEditando(null);
      setAviso({ tipo: 'ok', texto: 'Datos del repartidor actualizados.' });
      await cargar({ silencioso: true });
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message || 'No se pudieron guardar los datos.' });
    } finally {
      setGuardando('');
    }
  };

  const asignar = async (pedido, repartidorId) => {
    setGuardando(String(pedido.id));
    setAviso(null);
    try {
      await asignarRepartidorPedido(pedido.id, repartidorId || null);
      setSeleccion((actual) => ({ ...actual, [pedido.id]: repartidorId || '' }));
      setAviso({
        tipo: 'ok',
        texto: repartidorId
          ? `Envío #${pedido.numero} asignado a ${repartidores.find((r) => r.id === repartidorId)?.nombre || 'repartidor'}.`
          : `Envío #${pedido.numero} quedó sin repartidor.`,
      });
      await cargar({ silencioso: true });
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message || 'No se pudo asignar el envío.' });
    } finally {
      setGuardando('');
    }
  };

  const activos = repartidores.filter((r) => r.activo !== false);
  const enCurso = pedidos.filter((pedido) => etapaDe(pedido) !== 'entregado');
  const sinAsignar = enCurso.filter((pedido) => !pedido.repartidor_id).length;
  const asignados = enCurso.filter((pedido) => Boolean(pedido.repartidor_id)).length;

  const termino = buscar.trim().toLowerCase();
  const visibles = useMemo(() => {
    return enCurso
      .filter((pedido) => {
        if (filtro === 'sin' && pedido.repartidor_id) return false;
        if (filtro === 'con' && !pedido.repartidor_id) return false;
        if (!termino) return true;
        return [
          pedido.numero ? `#${pedido.numero}` : '',
          pedido.codigo,
          pedido.cliente,
          pedido.cliente_telefono,
          pedido.direccion_entrega,
          pedido.repartidor_nombre,
        ].join(' ').toLowerCase().includes(termino);
      })
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  }, [enCurso, filtro, termino]);

  return (
    <section className="drivers">
      <header className="drivers-hero">
        <div>
          <span>Reparto a domicilio</span>
          <h1>Repartidores y asignación de envíos</h1>
          <p>Cargá el vehículo y la placa de cada repartidor y asigná los envíos de clientes mayoristas.</p>
        </div>
        <div className="drivers-hero__tools">
          <button type="button" className="drivers-refresh" onClick={() => cargar()} disabled={cargando}>
            <RefreshCw size={16} className={cargando ? 'is-spinning' : ''} aria-hidden="true" />
            Actualizar
          </button>
        </div>
      </header>

      <section className="drivers-kpis" aria-label="Resumen del reparto">
        <article className="drivers-kpi">
          <span><UserRound size={15} aria-hidden="true" /> Repartidores activos</span>
          <b>{activos.length}</b>
        </article>
        <article className="drivers-kpi">
          <span><Truck size={15} aria-hidden="true" /> Envíos sin asignar</span>
          <b>{sinAsignar}</b>
        </article>
        <article className="drivers-kpi">
          <span><PackageCheck size={15} aria-hidden="true" /> Envíos asignados</span>
          <b>{asignados}</b>
        </article>
      </section>

      {aviso && (
        <p className={`drivers-toast ${aviso.tipo === 'error' ? 'is-error' : 'is-ok'}`} role="status">
          {aviso.tipo === 'error' ? <AlertTriangle size={17} aria-hidden="true" /> : <Check size={17} aria-hidden="true" />}
          {aviso.texto}
        </p>
      )}

      {error && (
        <div className="drivers-empty" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => cargar()}>Reintentar</button>
        </div>
      )}

      <section className="drivers-team" aria-label="Equipo de reparto">
        <header>
          <div>
            <h2>Equipo de reparto</h2>
            <p>Cuentas con rol despacho. El usuario es el correo con el que inician sesión.</p>
          </div>
        </header>
        {cargando && repartidores.length === 0 ? (
          <p className="drivers-state">Cargando repartidores…</p>
        ) : repartidores.length === 0 ? (
          <div className="drivers-empty">
            <UserRound size={30} aria-hidden="true" />
            <b>Todavía no hay repartidores</b>
            <p>Creá una cuenta con rol “Despacho” en Personal y volvé a esta pantalla.</p>
          </div>
        ) : (
          <div className="drivers-grid">
            {repartidores.map((repartidor) => (
              <article key={repartidor.id} className={`drivers-card ${repartidor.activo === false ? 'is-inactive' : ''}`}>
                <header>
                  <span className="drivers-card__icon"><Truck size={18} aria-hidden="true" /></span>
                  <div>
                    <h3>{repartidor.nombre}</h3>
                    <small className="drivers-card__user"><Mail size={13} aria-hidden="true" /> {repartidor.email}</small>
                  </div>
                  <span className={`drivers-badge ${repartidor.activo === false ? 'is-off' : 'is-ok'}`}>
                    {repartidor.activo === false ? 'Inactivo' : 'Activo'}
                  </span>
                </header>
                <dl className="drivers-card__data">
                  <div><dt>Vehículo</dt><dd>{repartidor.vehiculo || 'Sin registrar'}</dd></div>
                  <div><dt>Placa</dt><dd>{repartidor.placa || 'Sin registrar'}</dd></div>
                  <div><dt>Envíos asignados</dt><dd>{pedidos.filter((p) => p.repartidor_id === repartidor.id && etapaDe(p) !== 'entregado').length}</dd></div>
                </dl>
                <button type="button" className="drivers-btn is-soft" onClick={() => abrirEdicion(repartidor)}>
                  <Pencil size={15} aria-hidden="true" /> Editar vehículo y placa
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="drivers-orders" aria-label="Envíos a domicilio">
        <header>
          <div>
            <h2>Envíos de clientes mayoristas</h2>
            <p>Pedidos con entrega a domicilio que todavía no se entregaron.</p>
          </div>
          <div className="drivers-orders__tools">
            <label className="drivers-search">
              <Search size={17} aria-hidden="true" />
              <input
                type="search"
                value={buscar}
                onChange={(event) => setBuscar(event.target.value)}
                placeholder="Cliente, ticket o repartidor"
                aria-label="Buscar envío por cliente, ticket o repartidor"
              />
            </label>
            <div className="drivers-filter" role="group" aria-label="Filtrar envíos por asignación">
              {[['todos', 'Todos'], ['sin', 'Sin asignar'], ['con', 'Asignados']].map(([id, etiqueta]) => (
                <button
                  type="button"
                  key={id}
                  className={filtro === id ? 'is-active' : ''}
                  aria-pressed={filtro === id}
                  onClick={() => setFiltro(id)}
                >
                  {etiqueta}
                </button>
              ))}
            </div>
          </div>
        </header>

        {!error && visibles.length === 0 && !cargando && (
          <div className="drivers-empty">
            <PackageCheck size={30} aria-hidden="true" />
            <b>{termino ? 'Sin coincidencias' : 'No hay envíos pendientes de asignar'}</b>
            <p>{termino ? 'Probá con otro cliente, ticket o repartidor.' : 'Los envíos a domicilio aparecen acá hasta que se entregan.'}</p>
          </div>
        )}

        <div className="drivers-list" aria-live="polite">
          {visibles.map((pedido) => {
            const valor = seleccion[pedido.id] ?? (pedido.repartidor_id || '');
            const ocupado = guardando === String(pedido.id);
            const cambio = (valor || '') !== (pedido.repartidor_id || '');
            const etapa = etapaDe(pedido);
            return (
              <article key={pedido.id} className="drivers-row">
                <div className="drivers-row__main">
                  <span className="drivers-row__code">
                    Pedido #{pedido.numero} · {pedido.codigo || 'sin ticket'}
                  </span>
                  <h3>{pedido.cliente || 'Compra como invitado'}</h3>
                  <p className="drivers-row__address"><MapPin size={14} aria-hidden="true" /> {pedido.direccion_entrega || 'Sin dirección registrada'}</p>
                  <small>
                    {formatoFecha(pedido.fecha)} · {formatoMoneda(pedido.total)} ·{' '}
                    {etapa === 'en_camino' ? 'En camino' : etapa === 'entregado' ? 'Entregado' : 'Para entregar'}
                  </small>
                </div>
                <div className="drivers-row__assign">
                  <label>
                    <span>Repartidor</span>
                    <select
                      value={valor}
                      onChange={(event) => setSeleccion((actual) => ({ ...actual, [pedido.id]: event.target.value }))}
                      disabled={ocupado}
                      aria-label={`Repartidor para el pedido ${pedido.numero}`}
                    >
                      <option value="">Sin asignar</option>
                      {repartidores.map((repartidor) => (
                        <option value={repartidor.id} key={repartidor.id}>
                          {repartidor.nombre}{repartidor.placa ? ` · ${repartidor.placa}` : ''}{repartidor.activo === false ? ' (inactivo)' : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="drivers-btn is-primary"
                    disabled={ocupado || !cambio}
                    onClick={() => asignar(pedido, valor)}
                  >
                    {ocupado ? 'Guardando…' : pedido.repartidor_id ? 'Cambiar' : 'Asignar'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {editando && (
        <div className="drivers-modal" role="dialog" aria-modal="true" aria-labelledby="drivers-modal-title">
          <form onSubmit={guardarRepartidor}>
            <header>
              <div>
                <h2 id="drivers-modal-title">Datos del repartidor</h2>
                <p>Vehículo y placa que usa para repartir.</p>
              </div>
              <button type="button" aria-label="Cerrar" onClick={() => !guardando && setEditando(null)}>
                <X size={18} aria-hidden="true" />
              </button>
            </header>
            <div className="drivers-form">
              <label>
                Nombre
                <input
                  value={formulario.nombre}
                  onChange={(event) => setFormulario({ ...formulario, nombre: event.target.value })}
                  required
                  minLength="2"
                  maxLength="120"
                />
              </label>
              <label>
                Usuario (correo de acceso)
                <input value={editando.email} readOnly disabled />
              </label>
              <label>
                Vehículo
                <input
                  value={formulario.vehiculo}
                  onChange={(event) => setFormulario({ ...formulario, vehiculo: event.target.value })}
                  maxLength="60"
                  placeholder="Moto, auto, furgoneta…"
                />
              </label>
              <label>
                Número de placa
                <input
                  value={formulario.placa}
                  onChange={(event) => setFormulario({ ...formulario, placa: event.target.value.toUpperCase() })}
                  minLength="3"
                  maxLength="12"
                  placeholder="ABC123"
                />
                <small>Entre 3 y 12 caracteres, sin puntos.</small>
              </label>
              <label className="drivers-check">
                <input
                  type="checkbox"
                  checked={formulario.activo}
                  onChange={(event) => setFormulario({ ...formulario, activo: event.target.checked })}
                />
                Disponible para asignar envíos
              </label>
            </div>
            <footer>
              <button type="button" className="drivers-btn is-soft" onClick={() => setEditando(null)} disabled={Boolean(guardando)}>
                Cancelar
              </button>
              <button className="drivers-btn is-primary" disabled={Boolean(guardando)}>
                {guardando ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </footer>
          </form>
        </div>
      )}
    </section>
  );
}
