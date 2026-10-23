import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Car,
  Check,
  CheckCircle2,
  Clock3,
  MapPin,
  MessageCircle,
  Navigation,
  PackageCheck,
  Phone,
  RefreshCw,
  RotateCcw,
  Search,
  Truck,
  UserRound,
} from 'lucide-react';
import { actualizarEntregaPedido, listarPedidos } from '../../services/pedidoService.js';
import { getAdminUser } from '../../services/adminService.js';
import { formatoMoneda } from '../../utils/formatoMoneda.js';
import './DespachoAdmin.css';

const TABS = [
  ['pendiente', 'Para entregar'],
  ['en_camino', 'En camino'],
  ['entregado', 'Entregados'],
  ['todos', 'Todos'],
];
const CANCELADOS = ['cancelled', 'cancelado'];
const PAGADOS = ['completed', 'paid', 'pagado'];

function etapaDe(pedido) {
  const etapa = String(pedido?.estado_entrega || '').toLowerCase();
  if (etapa === 'entregado') return 'entregado';
  if (etapa === 'en_camino') return 'en_camino';
  return 'pendiente';
}

function formatoFecha(fecha) {
  if (!fecha) return '—';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/La_Paz',
  }).format(d);
}

function esHoy(fecha) {
  if (!fecha) return false;
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return false;
  const hoy = new Intl.DateTimeFormat('es-BO', { timeZone: 'America/La_Paz' }).format(new Date());
  return new Intl.DateTimeFormat('es-BO', { timeZone: 'America/La_Paz' }).format(valor) === hoy;
}

function telefonoParaMarcar(telefono) {
  const digitos = String(telefono || '').replace(/[^0-9+]/g, '');
  return digitos ? `tel:${digitos}` : '';
}

function telefonoWhatsApp(telefono) {
  let digitos = String(telefono || '').replace(/[^0-9]/g, '');
  if (!digitos) return '';
  if (digitos.length === 8) digitos = `591${digitos}`;
  return `https://wa.me/${digitos}`;
}

function enlaceMapa(pedido) {
  const lat = Number(pedido?.latitud_entrega);
  const lng = Number(pedido?.longitud_entrega);
  if (Number.isFinite(lat) && Number.isFinite(lng) && pedido?.latitud_entrega !== null && pedido?.longitud_entrega !== null) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  const direccion = String(pedido?.direccion_entrega || '').trim();
  return direccion ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}` : '';
}

export default function DespachoAdmin() {
  const usuario = getAdminUser();
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [buscar, setBuscar] = useState('');
  const [tab, setTab] = useState('pendiente');
  const [guardando, setGuardando] = useState('');
  const [aviso, setAviso] = useState(null);
  const [soloMios, setSoloMios] = useState(false);
  const primeraCarga = useRef(true);
  const puedeFiltrarMios = usuario?.rol === 'despacho' && Boolean(usuario?.id);

  const cargar = useCallback(async ({ silencioso = false } = {}) => {
    // En el primer render el estado inicial ya es "cargando" y sin error:
    // evitar setState sincrónico dentro del efecto de montaje.
    if (!primeraCarga.current) {
      if (!silencioso) setCargando(true);
      setError('');
    }
    try {
      const data = await listarPedidos({ entrega: 'domicilio', limite: 200 });
      const activos = (Array.isArray(data) ? data : []).filter(
        (pedido) => !CANCELADOS.includes(String(pedido.estado || '').toLowerCase())
      );
      setPedidos(activos);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los envíos.');
    } finally {
      primeraCarga.current = false;
      setCargando(false);
    }
  }, []);

  // La primera carga sí necesita el efecto: el estado de "cargando" ya viene en true.
  // oxlint-disable-next-line react/set-state-in-effect
  useEffect(() => { cargar(); }, [cargar]);

  // El reparto trabaja con el celular en la mano: refresco automático suave.
  useEffect(() => {
    const intervalo = setInterval(() => cargar({ silencioso: true }), 60000);
    return () => clearInterval(intervalo);
  }, [cargar]);

  useEffect(() => {
    if (!aviso) return undefined;
    const limpia = setTimeout(() => setAviso(null), 4500);
    return () => clearTimeout(limpia);
  }, [aviso]);

  const cambiarEtapa = async (pedido, etapa) => {
    setGuardando(String(pedido.id));
    setAviso(null);
    try {
      await actualizarEntregaPedido(pedido.id, etapa);
      const mensajes = {
        en_camino: 'Salida registrada: el pedido quedó en camino.',
        entregado: 'Entrega confirmada.',
        pendiente: 'El pedido volvió a la lista de pendientes.',
      };
      setAviso({ tipo: 'ok', texto: mensajes[etapa] || 'Envío actualizado.' });
      await cargar({ silencioso: true });
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message || 'No se pudo actualizar el envío.' });
    } finally {
      setGuardando('');
    }
  };

  const conteos = useMemo(() => {
    const base = { pendiente: 0, en_camino: 0, entregado: 0, entregadoHoy: 0 };
    pedidos.forEach((pedido) => {
      const etapa = etapaDe(pedido);
      base[etapa] += 1;
      if (etapa === 'entregado' && esHoy(pedido.entrega_confirmada)) base.entregadoHoy += 1;
    });
    return base;
  }, [pedidos]);

  const termino = buscar.trim().toLowerCase();
  const visibles = useMemo(() => {
    const lista = pedidos.filter((pedido) => {
      if (tab !== 'todos' && etapaDe(pedido) !== tab) return false;
      if (soloMios && pedido.repartidor_id !== usuario?.id) return false;
      if (!termino) return true;
      return [
        pedido.numero ? `#${pedido.numero}` : '',
        pedido.codigo,
        pedido.cliente,
        pedido.cliente_telefono,
        pedido.cliente_nit,
        pedido.direccion_entrega,
        pedido.referencia_entrega,
        pedido.items,
        pedido.repartidor_nombre,
      ]
        .join(' ')
        .toLowerCase()
        .includes(termino);
    });
    return lista.sort((a, b) => {
      if (tab === 'entregado' || tab === 'todos') {
        return new Date(b.entrega_confirmada || b.fecha).getTime() - new Date(a.entrega_confirmada || a.fecha).getTime();
      }
      return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
    });
  }, [pedidos, tab, termino, soloMios, usuario?.id]);

  return (
    <section className="dispatch">
      <header className="dispatch-hero">
        <div>
          <span>Reparto a domicilio · {usuario?.nombre || 'Despacho'}</span>
          <h1>Envíos a clientes mayoristas</h1>
          <p>Solo pedidos con entrega a domicilio registrada. Actualizá la etapa a medida que salís y entregás.</p>
        </div>
        <div className="dispatch-hero__tools">
          <label className="dispatch-search">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              value={buscar}
              onChange={(event) => setBuscar(event.target.value)}
              placeholder="Cliente, teléfono, ticket o dirección"
              aria-label="Buscar envío por cliente, teléfono, ticket o dirección"
            />
          </label>
          <button
            type="button"
            className="dispatch-refresh"
            onClick={() => cargar()}
            disabled={cargando}
          >
            <RefreshCw size={16} className={cargando ? 'is-spinning' : ''} aria-hidden="true" />
            Actualizar
          </button>
        </div>
      </header>

      <section className="dispatch-kpis" aria-label="Resumen de envíos">
        <article className="dispatch-kpi">
          <span><Clock3 size={15} aria-hidden="true" /> Para entregar</span>
          <b>{conteos.pendiente}</b>
        </article>
        <article className="dispatch-kpi">
          <span><Truck size={15} aria-hidden="true" /> En camino</span>
          <b>{conteos.en_camino}</b>
        </article>
        <article className="dispatch-kpi">
          <span><PackageCheck size={15} aria-hidden="true" /> Entregados hoy</span>
          <b>{conteos.entregadoHoy}</b>
        </article>
      </section>

      <nav className="dispatch-tabs" aria-label="Filtrar envíos por etapa">
        {TABS.map(([id, etiqueta]) => (
          <button
            type="button"
            key={id}
            className={tab === id ? 'is-active' : ''}
            onClick={() => setTab(id)}
            aria-pressed={tab === id}
          >
            {etiqueta}
            {id !== 'todos' && <i>{conteos[id]}</i>}
          </button>
        ))}
        {puedeFiltrarMios && (
          <button
            type="button"
            className={`dispatch-tabs__mine ${soloMios ? 'is-active' : ''}`}
            onClick={() => setSoloMios((valor) => !valor)}
            aria-pressed={soloMios}
          >
            <UserRound size={15} aria-hidden="true" /> Solo mis envíos
          </button>
        )}
      </nav>

      {aviso && (
        <p className={`dispatch-toast ${aviso.tipo === 'error' ? 'is-error' : 'is-ok'}`} role="status">
          {aviso.tipo === 'error' ? <AlertTriangle size={17} aria-hidden="true" /> : <Check size={17} aria-hidden="true" />}
          {aviso.texto}
        </p>
      )}

      {error && (
        <div className="dispatch-empty" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => cargar()}>Reintentar</button>
        </div>
      )}

      {!error && cargando && pedidos.length === 0 && <p className="dispatch-state">Cargando envíos…</p>}

      {!error && !cargando && visibles.length === 0 && (
        <div className="dispatch-empty">
          <PackageCheck size={34} aria-hidden="true" />
          <b>{termino ? 'Sin coincidencias' : 'No hay envíos en esta etapa'}</b>
          <p>{termino ? 'Probá con otro cliente, teléfono o ticket.' : 'Los pedidos con envío a domicilio aparecen acá.'}</p>
        </div>
      )}

      <section className="dispatch-list" aria-live="polite" aria-label="Pedidos con envío a domicilio">
        {visibles.map((pedido) => {
          const etapa = etapaDe(pedido);
          const ocupado = guardando === String(pedido.id);
          const telefono = pedido.cliente_telefono;
          const mapa = enlaceMapa(pedido);
          const cobrado = PAGADOS.includes(String(pedido.estado || '').toLowerCase());
          const whatsapp = telefonoWhatsApp(telefono);
          const mensaje = encodeURIComponent(`Hola ${pedido.cliente || ''}, te escribimos de TERRA por tu pedido ${pedido.codigo || ''}.`);
          return (
            <article key={pedido.id} className={`dispatch-card is-${etapa}`}>
              <header>
                <div>
                  <span className="dispatch-card__code">
                    {pedido.numero ? `Pedido #${pedido.numero}` : 'Pedido'} · {pedido.codigo || 'sin ticket'}
                  </span>
                  <h2>{pedido.cliente || 'Compra como invitado'}</h2>
                  <small>
                    {telefono ? <>Tel. {telefono}</> : 'Sin teléfono registrado'}
                    {pedido.cliente_nit ? <> · NIT {pedido.cliente_nit}</> : null}
                  </small>
                </div>
                <div className="dispatch-card__badges">
                  <span className={`dispatch-badge is-${etapa}`}>
                    {etapa === 'pendiente' ? 'Para entregar' : etapa === 'en_camino' ? 'En camino' : 'Entregado'}
                  </span>
                  <span className={`dispatch-badge is-pago ${cobrado ? 'is-ok' : 'is-warn'}`}>
                    {cobrado ? 'Cobrado' : 'Pago pendiente'}
                  </span>
                </div>
              </header>

              <div className="dispatch-address">
                <MapPin size={19} aria-hidden="true" />
                <div>
                  <b>Dirección de entrega</b>
                  <p>{pedido.direccion_entrega || 'Sin dirección registrada'}</p>
                  {pedido.referencia_entrega && <small>Referencia: {pedido.referencia_entrega}</small>}
                </div>
              </div>

              <p className={`dispatch-driver ${pedido.repartidor_nombre ? 'is-assigned' : ''}`}>
                <Car size={15} aria-hidden="true" />
                {pedido.repartidor_nombre
                  ? <>Repartidor: <b>{pedido.repartidor_nombre}</b>{pedido.repartidor_placa ? ` · ${pedido.repartidor_placa}` : ''}</>
                  : 'Sin repartidor asignado (se asigna en Repartidores).'}
              </p>

              <div className="dispatch-data">
                <p><b>Artículos:</b> {pedido.items || 'Sin artículos'}</p>
                <div>
                  <span><b>{formatoMoneda(pedido.total)}</b> · {formatoFecha(pedido.fecha)}</span>
                  {etapa === 'entregado' && pedido.entrega_confirmada && (
                    <small>Entregado {formatoFecha(pedido.entrega_confirmada)}</small>
                  )}
                  {etapa === 'en_camino' && pedido.entrega_iniciada && (
                    <small>Salió {formatoFecha(pedido.entrega_iniciada)}</small>
                  )}
                </div>
              </div>

              <footer className="dispatch-actions">
                {telefono && (
                  <a href={telefonoParaMarcar(telefono)} className="dispatch-btn is-soft">
                    <Phone size={16} aria-hidden="true" /> Llamar
                  </a>
                )}
                {whatsapp && (
                  <a href={`${whatsapp}?text=${mensaje}`} target="_blank" rel="noreferrer" className="dispatch-btn is-soft">
                    <MessageCircle size={16} aria-hidden="true" /> WhatsApp
                  </a>
                )}
                {mapa && (
                  <a href={mapa} target="_blank" rel="noreferrer" className="dispatch-btn is-soft">
                    <Navigation size={16} aria-hidden="true" /> Mapa
                  </a>
                )}
                {etapa === 'pendiente' && (
                  <>
                    <button type="button" className="dispatch-btn is-primary" onClick={() => cambiarEtapa(pedido, 'en_camino')} disabled={ocupado}>
                      <Truck size={16} aria-hidden="true" /> {ocupado ? 'Guardando…' : 'Salir a entregar'}
                    </button>
                    <button type="button" className="dispatch-btn is-ghost" onClick={() => cambiarEtapa(pedido, 'entregado')} disabled={ocupado}>
                      <CheckCircle2 size={16} aria-hidden="true" /> Entregado
                    </button>
                  </>
                )}
                {etapa === 'en_camino' && (
                  <>
                    <button type="button" className="dispatch-btn is-primary" onClick={() => cambiarEtapa(pedido, 'entregado')} disabled={ocupado}>
                      <CheckCircle2 size={16} aria-hidden="true" /> {ocupado ? 'Guardando…' : 'Confirmar entrega'}
                    </button>
                    <button type="button" className="dispatch-btn is-ghost" onClick={() => cambiarEtapa(pedido, 'pendiente')} disabled={ocupado}>
                      <RotateCcw size={16} aria-hidden="true" /> Volver a pendiente
                    </button>
                  </>
                )}
              </footer>
            </article>
          );
        })}
      </section>
    </section>
  );
}
