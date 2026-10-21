import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bell, BellRing, RefreshCw } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { listarPedidos } from '../../services/pedidoService.js';
import { formatoMoneda } from '../../utils/formatoMoneda.js';
import './TimbrePedidos.css';

// Cada cuánto se consultan los pedidos pendientes (el cajero ve el aviso sin recargar).
const INTERVALO_MS = 15000;
const MAXIMO_EN_LISTA = 6;

/**
 * Timbre de nuevos pedidos para el backoffice y el portal del vendedor.
 * Consulta los pedidos pendientes de pago, avisa con sonido y muestra el
 * teléfono del cliente para ubicarlo rápido en caja.
 */
export default function TimbrePedidos() {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendientes, setPendientes] = useState([]);
  const [nuevos, setNuevos] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [sonidoListo, setSonidoListo] = useState(false);
  const conocidos = useRef(null);
  const montado = useRef(true);
  const contenedor = useRef(null);
  const audio = useRef(null);
  const base = location.pathname.startsWith('/vendedor') ? '/vendedor' : '/admin';

  // Los navegadores bloquean el audio hasta el primer gesto del usuario.
  const activarAudio = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (!audio.current) {
      const Constructor = window.AudioContext || window.webkitAudioContext;
      if (!Constructor) return null;
      try { audio.current = new Constructor(); } catch { return null; }
    }
    if (audio.current.state === 'suspended') audio.current.resume().catch(() => {});
    setSonidoListo(audio.current.state === 'running');
    return audio.current;
  }, []);

  useEffect(() => {
    document.addEventListener('pointerdown', activarAudio, { once: true });
    document.addEventListener('keydown', activarAudio, { once: true });
    return () => {
      document.removeEventListener('pointerdown', activarAudio);
      document.removeEventListener('keydown', activarAudio);
    };
  }, [activarAudio]);

  const timbrar = useCallback(() => {
    const contexto = activarAudio();
    if (!contexto) {
      navigator.vibrate?.([140, 70, 140]);
      return;
    }
    const tocar = () => {
      const inicio = contexto.currentTime + 0.02;
      [[880, 0], [1174.66, 0.19], [880, 0.44], [1174.66, 0.63]].forEach(([frecuencia, retraso]) => {
        const oscilador = contexto.createOscillator();
        const ganancia = contexto.createGain();
        const arranque = inicio + retraso;
        oscilador.type = 'sine';
        oscilador.frequency.value = frecuencia;
        ganancia.gain.setValueAtTime(0.0001, arranque);
        ganancia.gain.exponentialRampToValueAtTime(0.22, arranque + 0.02);
        ganancia.gain.exponentialRampToValueAtTime(0.0001, arranque + 0.17);
        oscilador.connect(ganancia).connect(contexto.destination);
        oscilador.start(arranque);
        oscilador.stop(arranque + 0.2);
      });
    };
    if (contexto.state === 'suspended') contexto.resume().then(tocar).catch(() => {});
    else tocar();
    navigator.vibrate?.([140, 70, 140]);
  }, [activarAudio]);

  const consultar = useCallback(async () => {
    try {
      const filas = await listarPedidos({ estado: 'pending', limite: 100 });
      if (!montado.current) return;
      const lista = Array.isArray(filas) ? filas : [];
      setPendientes(lista);
      setError('');
      setCargando(false);
      const ids = new Set(lista.map((pedido) => pedido.id));
      if (!conocidos.current) {
        // Primera consulta: lo que ya estaba pendiente no hace sonar el timbre.
        conocidos.current = ids;
        return;
      }
      const recien = lista.filter((pedido) => !conocidos.current.has(pedido.id));
      conocidos.current = new Set([...conocidos.current, ...ids]);
      if (!recien.length) return;
      setNuevos((previos) => [...recien, ...previos].slice(0, 20));
      setAviso(recien);
      timbrar();
      window.dispatchEvent(new CustomEvent('terra:pedidos-nuevos', { detail: { pedidos: recien } }));
    } catch (err) {
      if (!montado.current) return;
      setCargando(false);
      setError(err?.message || 'No se pudieron consultar los pedidos nuevos.');
    }
  }, [timbrar]);

  useEffect(() => {
    montado.current = true;
    consultar();
    const id = setInterval(consultar, INTERVALO_MS);
    return () => { montado.current = false; clearInterval(id); };
  }, [consultar]);

  useEffect(() => {
    if (!aviso) return undefined;
    const id = setTimeout(() => setAviso(null), 12000);
    return () => clearTimeout(id);
  }, [aviso]);

  // Mientras el aviso está visible parpadea el título de la pestaña: sirve
  // cuando el vendedor está en otra pestaña de la tablet o del mostrador.
  useEffect(() => {
    if (!aviso) return undefined;
    const original = document.title.replace(/^🔔\s*/, '');
    const texto = `🔔 ${aviso.length === 1 ? '1 pedido nuevo' : `${aviso.length} pedidos nuevos`}`;
    let alternar = false;
    document.title = `${texto} · ${original}`;
    const id = setInterval(() => {
      alternar = !alternar;
      document.title = alternar ? original : `${texto} · ${original}`;
    }, 1500);
    return () => { clearInterval(id); document.title = original; };
  }, [aviso]);

  useEffect(() => {
    if (!abierto) return undefined;
    const cerrar = (evento) => {
      if (contenedor.current && !contenedor.current.contains(evento.target)) setAbierto(false);
    };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, [abierto]);

  const alternar = () => {
    const siguiente = !abierto;
    setAbierto(siguiente);
    activarAudio();
    if (siguiente) {
      setNuevos([]);
      consultar();
    }
  };

  const irAPedidos = () => {
    setAbierto(false);
    setNuevos([]);
    navigate(`${base}/pedidos`);
  };

  const visibles = useMemo(() => pendientes.slice(0, MAXIMO_EN_LISTA), [pendientes]);
  const total = pendientes.length;
  const nuevas = nuevos.length;

  return <>
    <div className="timbre" ref={contenedor}>
      <button
        type="button"
        className={`timbre__btn ${nuevas ? 'is-nuevo' : ''}`}
        onClick={alternar}
        aria-label={`Pedidos por cobrar: ${total}`}
        aria-expanded={abierto}
        title={total ? `${total} pedido(s) por cobrar` : 'Pedidos por cobrar'}
      >
        {nuevas ? <BellRing size={19} /> : <Bell size={19} />}
        {total > 0 && <span className={`timbre__badge ${nuevas ? 'is-nuevo' : ''}`}>{total > 99 ? '99+' : total}</span>}
      </button>

      {abierto && <div className="timbre__menu" role="dialog" aria-label="Pedidos por cobrar">
        <header className="timbre__head">
          <div><strong>Pedidos por cobrar</strong><small>{total ? `${total} en caja` : 'Sin pedidos pendientes'}</small></div>
          <button type="button" className="timbre__refresh" onClick={consultar} disabled={cargando} title="Actualizar pedidos"><RefreshCw size={15} /></button>
        </header>
        {!sonidoListo && <p className="timbre__hint">Toca la campana para habilitar el sonido del timbre.</p>}
        {cargando && <p className="timbre__empty">Consultando pedidos…</p>}
        {!cargando && error && <p className="timbre__error">{error}</p>}
        {!cargando && !error && !total && <p className="timbre__empty">Cuando un cliente compre, el pedido aparecerá acá y sonará el timbre.</p>}
        {visibles.map((pedido) => <button type="button" className="timbre__item" key={pedido.id} onClick={irAPedidos}>
          <span className="timbre__item-top"><b>#{pedido.codigo}</b><strong>{formatoMoneda(pedido.total)}</strong></span>
          <span className="timbre__item-cliente">{pedido.cliente}</span>
          <span className="timbre__item-meta">
            {pedido.cliente_telefono ? <span>Tel. {pedido.cliente_telefono}</span> : null}
            {pedido.cliente_nit ? <span>NIT {pedido.cliente_nit}</span> : null}
            <span>{new Date(pedido.fecha).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}</span>
          </span>
        </button>)}
        <footer className="timbre__foot">
          {total > visibles.length ? <small>y {total - visibles.length} más</small> : <small />}
          <button type="button" onClick={irAPedidos}>Ver todos los pedidos</button>
        </footer>
      </div>}
    </div>

    {aviso && <button type="button" className="timbre__toast" aria-live="polite" onClick={() => { setAviso(null); irAPedidos(); }}>
      <span className="timbre__toast-icon"><BellRing size={20} /></span>
      <span className="timbre__toast-text">
        <b>{aviso.length === 1 ? '¡Nuevo pedido!' : `¡${aviso.length} pedidos nuevos!`}</b>
        <small>#{aviso[0].codigo} · {aviso[0].cliente} · {formatoMoneda(aviso[0].total)}</small>
      </span>
      <span className="timbre__toast-cta">Cobrar</span>
    </button>}
  </>;
}
