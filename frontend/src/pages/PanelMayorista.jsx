import { useContext, useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  Home,
  Info,
  Loader2,
  Mail,
  PhoneCall,
  Save,
  Truck,
  User,
} from 'lucide-react';
import { SesionClienteContext } from '../context/SesionClienteContext.jsx';
import { actualizarPerfilMayorista } from '../services/sesionClienteService.js';
import { apiRequest } from '../services/api.js';
import MapaEntregaMayorista from '../components/mayorista/MapaEntregaMayorista.jsx';

export default function PanelMayorista() {
  const { sesion, esMayorista, iniciarSesion } = useContext(SesionClienteContext);

  // Estados del formulario inicializados con datos de sesión o valores B2B institucionales
  const [nombreTitular, setNombreTitular] = useState(sesion?.titular || '');
  const [telefono, setTelefono] = useState(sesion?.telefono || '');
  const [correo, setCorreo] = useState(sesion?.email || '');
  const [razonSocial, setRazonSocial] = useState(sesion?.nombre || '');
  const [nit, setNit] = useState(sesion?.nit || '');
  const [direccion, setDireccion] = useState(sesion?.direccion || '');
  const [referencia, setReferencia] = useState(sesion?.referencia || '');
  const [gps, setGps] = useState(
    sesion?.gps ||
      (sesion?.latitud != null && sesion?.longitud != null
        ? `${sesion.latitud}, ${sesion.longitud}`
        : '')
  );
  const [guardadoExito, setGuardadoExito] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [cargandoUbicacion, setCargandoUbicacion] = useState(false);
  const [cargandoDireccion, setCargandoDireccion] = useState(false);

  const geocodificacionRef = useRef({ timer: null, controller: null });
  const direccionManualRef = useRef(false);

  useEffect(() => {
    return () => {
      clearTimeout(geocodificacionRef.current.timer);
      geocodificacionRef.current.controller?.abort();
    };
  }, []);

  if (!esMayorista) return <Navigate to="/catalogo" replace />;

  // Generar iniciales a partir de la Razón Social o Nombre
  const iniciales = String(razonSocial || 'MV')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();

  const aplicarPerfil = (perfil) => {
    if (!perfil) return;
    setNombreTitular(perfil.titular || '');
    setTelefono(perfil.telefono || '');
    setCorreo(perfil.email || '');
    setRazonSocial(perfil.nombre || '');
    setNit(perfil.nit || '');
    setDireccion(perfil.direccion || '');
    setReferencia(perfil.referencia || '');
    setGps(
      perfil.gps ||
        (perfil.latitud != null && perfil.longitud != null
          ? `${perfil.latitud}, ${perfil.longitud}`
          : '')
    );
  };

  // Detectar la dirección escrita a partir de las coordenadas del mapa o del GPS.
  const programarGeocodificacion = (valorGps) => {
    const [lat, lng] = String(valorGps || '').split(',').map((parte) => Number(parte.trim()));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    clearTimeout(geocodificacionRef.current.timer);
    geocodificacionRef.current.controller?.abort();
    direccionManualRef.current = false;
    setCargandoDireccion(true);

    const controller = new AbortController();
    geocodificacionRef.current.controller = controller;
    geocodificacionRef.current.timer = setTimeout(async () => {
      try {
        let direccionDetectada = '';

        // 1. Intentar con el backend local (/api/geocodificacion/reverse)
        try {
          const datos = await apiRequest(
            `/geocodificacion/reverse?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`,
            { signal: controller.signal }
          );
          direccionDetectada = datos?.direccion || '';
        } catch (errBackend) {
          if (errBackend.name === 'AbortError') throw errBackend;
          // Si el backend no responde o devuelve 404, se continúa al fallback directo
        }

        // 2. Fallback directo a OpenStreetMap Nominatim desde el navegador
        if (!direccionDetectada && !controller.signal.aborted) {
          const params = new URLSearchParams({
            format: 'jsonv2',
            lat: String(lat),
            lon: String(lng),
            addressdetails: '1',
            'accept-language': 'es',
          });
          const respuesta = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
            headers: { Accept: 'application/json' },
            signal: controller.signal,
          });
          if (respuesta.ok) {
            const json = await respuesta.json();
            const partes = json?.address || {};
            const via =
              partes.road ||
              partes.pedestrian ||
              partes.residential ||
              partes.footway ||
              partes.path ||
              partes.cycleway ||
              '';
            const numero = partes.house_number ? ` #${partes.house_number}` : '';
            const zona = partes.neighbourhood || partes.suburb || '';
            if (via) {
              const base = `${via}${numero}`.trim();
              direccionDetectada = zona && !via.toLowerCase().includes(zona.toLowerCase())
                ? `${base}, ${zona}`
                : base;
            } else {
              direccionDetectada =
                [partes.neighbourhood, partes.suburb, partes.city].filter(Boolean).join(', ') ||
                String(json?.display_name || '').split(',').slice(0, 2).join(',').trim();
            }
          }
        }

        if (direccionDetectada && !controller.signal.aborted && !direccionManualRef.current) {
          setDireccion(direccionDetectada);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.warn('Geocodificación inversa no completada:', error);
        }
      } finally {
        if (!controller.signal.aborted) setCargandoDireccion(false);
      }
    }, 250);
  };

  const handleGpsChange = (nuevoGps) => {
    setGps(nuevoGps);
    programarGeocodificacion(nuevoGps);
  };

  const handleDireccionChange = (e) => {
    direccionManualRef.current = true;
    setDireccion(e.target.value);
  };

  // Guardar cambios en el backend y actualizar la sesión en memoria.
  const handleGuardar = async (e) => {
    if (e) e.preventDefault();
    if (!sesion?.token || guardando) return;

    setGuardadoExito(false);
    setErrorGuardado('');
    if (!direccion.trim()) {
      setErrorGuardado('Ingresá la dirección de envío antes de guardar.');
      return;
    }

    setGuardando(true);

    try {
      const actualizado = await actualizarPerfilMayorista(sesion.token, {
        nombre: razonSocial,
        titular: nombreTitular,
        telefono,
        nit,
        direccion,
        referencia,
        gps,
      });
      iniciarSesion({ ...sesion, ...actualizado, token: sesion.token });
      aplicarPerfil(actualizado);
      setGuardadoExito(true);
      setTimeout(() => setGuardadoExito(false), 4500);
    } catch (error) {
      setErrorGuardado(error.message || 'No se pudo guardar el perfil y la dirección de envío.');
    } finally {
      setGuardando(false);
    }
  };

  // Geolocalización GPS
  const handleObtenerGps = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }
    setCargandoUbicacion(true);
    setErrorGuardado('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nuevoGps = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
        setGps(nuevoGps);
        programarGeocodificacion(nuevoGps);
        setCargandoUbicacion(false);
      },
      () => {
        setCargandoUbicacion(false);
        setErrorGuardado('No se pudo obtener la ubicación GPS. Puedes fijar el punto manualmente en el mapa.');
      },
      { timeout: 7000 }
    );
  };

  // Cancelar / Restablecer los valores guardados en la sesión.
  const handleCancelar = () => {
    aplicarPerfil(sesion);
    setGuardadoExito(false);
    setErrorGuardado('');
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 font-terra text-terra-texto pb-14">
      {/* 1. Header con Breadcrumbs y Botones de Acción */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-3 border-b border-terra-borde">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-terra-xs font-semibold">
            <span className="font-extrabold tracking-wider uppercase text-terra-primario dark:text-terra-acento">
              Portal Mayorista
            </span>
            <span className="text-terra-texto-suave">/</span>
            <span className="text-terra-texto-suave">Mi Cuenta</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-terra-texto tracking-tight m-0 leading-tight">
            Mi Perfil Mayorista
          </h1>
          <p className="text-terra-xs sm:text-terra-sm text-terra-texto-suave m-0 leading-relaxed">
            Actualiza tus datos de contacto comercial, facturación y la ubicación de tu domicilio para la entrega de tus pedidos.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            className="px-4 py-2.5 rounded-terra-boton border border-terra-borde bg-terra-control hover:bg-terra-control-hover text-terra-texto text-terra-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            onClick={handleCancelar}
            disabled={guardando}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-terra-boton bg-terra-primario hover:bg-terra-primario-oscuro text-white text-terra-xs font-bold transition-colors cursor-pointer disabled:opacity-50 shadow-terra-sm"
            onClick={handleGuardar}
            disabled={guardando}
          >
            <CheckCircle2 size={17} />
            <span>{guardando ? 'Guardando…' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </section>

      {/* Alertas interactivas */}
      {guardadoExito && (
        <div
          role="status"
          className="p-3.5 rounded-terra-campo bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2.5 text-terra-xs font-semibold"
        >
          <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>¡Datos de perfil comercial, facturación y dirección de envío actualizados correctamente!</span>
        </div>
      )}

      {errorGuardado && (
        <div
          role="alert"
          className="p-3.5 rounded-terra-campo bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200 border border-rose-200 dark:border-rose-800/60 flex items-center gap-2.5 text-terra-xs font-semibold"
        >
          <Info size={18} className="text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{errorGuardado}</span>
        </div>
      )}

      {/* 2. Hero Card (Avatar / Razón Social & Metadatos) */}
      <article className="p-6 rounded-terra-tarjeta bg-terra-superficie border border-terra-borde shadow-terra-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="size-16 sm:size-20 rounded-2xl bg-terra-primario-suave border border-terra-primario/20 flex flex-col items-center justify-center text-terra-primario dark:text-terra-acento shrink-0 shadow-terra-sm">
            <span className="text-xl sm:text-2xl font-black">{iniciales}</span>
            <span className="text-terra-3xs font-extrabold uppercase tracking-wider opacity-80">Mayorista</span>
          </div>

          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-bold text-terra-texto m-0 truncate">
                {razonSocial}
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-terra-3xs font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                <BadgeCheck size={13} />
                Cliente Mayorista Autorizado
              </span>
            </div>
            <p className="text-terra-xs text-terra-texto-suave m-0 flex flex-wrap items-center gap-2 font-medium">
              <span className="font-bold text-terra-texto">Titular: {nombreTitular}</span>
              <span>•</span>
              <span>
                NIT: <strong className="font-mono text-terra-texto">{nit}</strong>
              </span>
              <span>•</span>
              <span>Santa Cruz, Bolivia</span>
            </p>
          </div>
        </div>
      </article>

      {/* 3. Formulario Principal */}
      <form id="form-perfil-mayorista" onSubmit={handleGuardar} className="flex flex-col gap-6">
        {/* Sección A: Datos de Contacto y Representación Comercial */}
        <section className="p-6 rounded-terra-tarjeta bg-terra-superficie border border-terra-borde shadow-terra-sm flex flex-col gap-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-terra-borde">
            <Building2 size={20} className="text-terra-primario dark:text-terra-acento" />
            <h3 className="text-terra-md font-bold text-terra-texto m-0">
              Datos de Contacto y Representación Comercial
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre completo */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="input-nombre" className="text-terra-xs font-bold text-terra-texto">
                Nombre completo del encargado / titular
              </label>
              <div className="relative flex items-center">
                <User size={18} className="absolute left-3.5 text-terra-texto-suave pointer-events-none" />
                <input
                  id="input-nombre"
                  required
                  type="text"
                  value={nombreTitular}
                  onChange={(e) => setNombreTitular(e.target.value)}
                  className="w-full min-h-[3rem] pl-10 pr-3.5 rounded-terra-campo bg-terra-superficie-2 border border-terra-borde text-terra-texto text-terra-sm placeholder:text-terra-texto-suave outline-none focus:border-terra-primario focus:ring-2 focus:ring-terra-primario/15 transition-all"
                />
              </div>
            </div>

            {/* Teléfono móvil */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="input-telefono" className="text-terra-xs font-bold text-terra-texto">
                Teléfono móvil / WhatsApp directo (Entrega)
              </label>
              <div className="relative flex items-center">
                <PhoneCall size={18} className="absolute left-3.5 text-emerald-600 dark:text-emerald-400 pointer-events-none" />
                <input
                  id="input-telefono"
                  required
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full min-h-[3rem] pl-10 pr-3.5 rounded-terra-campo bg-terra-superficie-2 border border-terra-borde text-terra-texto text-terra-sm font-mono placeholder:text-terra-texto-suave outline-none focus:border-terra-primario focus:ring-2 focus:ring-terra-primario/15 transition-all"
                />
              </div>
              <p className="text-terra-3xs text-terra-texto-suave m-0">
                Utilizado para coordinar la entrega de tu pedido.
              </p>
            </div>

            {/* Correo electrónico */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="input-correo" className="text-terra-xs font-bold text-terra-texto">
                Correo electrónico de facturación y notas de entrega
              </label>
              <div className="relative flex items-center">
                <Mail size={18} className="absolute left-3.5 text-terra-texto-suave pointer-events-none" />
                <input
                  id="input-correo"
                  required
                  readOnly
                  title="El correo de acceso se gestiona con soporte TERRA"
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className="w-full min-h-[3rem] pl-10 pr-3.5 rounded-terra-campo bg-terra-control border border-terra-borde text-terra-texto-suave text-terra-sm outline-none cursor-not-allowed"
                />
              </div>
            </div>

            {/* Razón Social y NIT Comercial */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="input-razon" className="text-terra-xs font-bold text-terra-texto">
                  Razón Social
                </label>
                <input
                  id="input-razon"
                  required
                  type="text"
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  className="w-full min-h-[3rem] px-3.5 rounded-terra-campo bg-terra-superficie-2 border border-terra-borde text-terra-texto text-terra-sm outline-none focus:border-terra-primario focus:ring-2 focus:ring-terra-primario/15 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="input-nit" className="text-terra-xs font-bold text-terra-texto">
                  NIT Comercial
                </label>
                <input
                  id="input-nit"
                  maxLength={20}
                  inputMode="numeric"
                  type="text"
                  value={nit}
                  onChange={(e) => setNit(e.target.value)}
                  className="w-full min-h-[3rem] px-3.5 rounded-terra-campo bg-terra-superficie-2 border border-terra-borde text-terra-texto text-terra-sm font-mono font-bold outline-none focus:border-terra-primario focus:ring-2 focus:ring-terra-primario/15 transition-all"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Sección B: Dirección de Envío */}
        <section className="p-6 rounded-terra-tarjeta bg-terra-superficie border border-terra-borde shadow-terra-sm flex flex-col gap-5">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-terra-borde">
            <div className="flex items-center gap-2.5">
              <Truck size={20} className="text-terra-primario dark:text-terra-acento" />
              <h3 className="text-terra-md font-bold text-terra-texto m-0">
                Dirección de Envío
              </h3>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-terra-3xs font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              <CheckCircle2 size={13} />
              Ubicación de entrega registrada
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dirección de envío */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="input-direccion" className="text-terra-xs font-bold text-terra-texto">
                Dirección de envío / Domicilio
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-terra-texto-suave pointer-events-none">
                  {cargandoDireccion ? (
                    <Loader2 size={18} className="animate-spin text-terra-primario dark:text-terra-acento" />
                  ) : (
                    <Home size={18} />
                  )}
                </span>
                <input
                  id="input-direccion"
                  placeholder="Ej.: Av. Banzer #123, Bartos"
                  required
                  maxLength={250}
                  type="text"
                  value={direccion}
                  onChange={handleDireccionChange}
                  className="w-full min-h-[3rem] pl-10 pr-3.5 rounded-terra-campo bg-terra-superficie-2 border border-terra-borde text-terra-texto text-terra-sm placeholder:text-terra-texto-suave outline-none focus:border-terra-primario focus:ring-2 focus:ring-terra-primario/15 transition-all"
                />
              </div>
              <p className="text-terra-3xs text-terra-texto-suave m-0">
                {cargandoDireccion ? (
                  <span className="text-terra-primario dark:text-terra-acento font-semibold inline-flex items-center gap-1">
                    <Loader2 size={12} className="animate-spin" />
                    Detectando dirección automáticamente desde el mapa…
                  </span>
                ) : (
                  'Se completa automáticamente al mover o hacer clic en el mapa. También puedes editarla manualmente.'
                )}
              </p>
            </div>

            {/* Referencias */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="input-referencia" className="text-terra-xs font-bold text-terra-texto">
                Referencia para ubicar tu domicilio
              </label>
              <div className="relative flex items-center">
                <Info size={18} className="absolute left-3.5 text-terra-texto-suave pointer-events-none" />
                <input
                  id="input-referencia"
                  maxLength={250}
                  type="text"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  className="w-full min-h-[3rem] pl-10 pr-3.5 rounded-terra-campo bg-terra-superficie-2 border border-terra-borde text-terra-texto text-terra-sm placeholder:text-terra-texto-suave outline-none focus:border-terra-primario focus:ring-2 focus:ring-terra-primario/15 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Mapa Leaflet interactivo */}
          <MapaEntregaMayorista
            gps={gps}
            onGpsChange={handleGpsChange}
            razonSocial={razonSocial}
            direccion={direccion}
            cargandoGps={cargandoUbicacion}
            onObtenerGps={handleObtenerGps}
          />
        </section>

        {/* Footer del Formulario */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
          <p className="text-terra-xs text-terra-texto-suave m-0 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Tus datos comerciales se mantienen sincronizados con tu cuenta mayorista de Terra Autoservicio.</span>
          </p>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              className="px-4 py-2.5 rounded-terra-boton border border-terra-borde bg-terra-control hover:bg-terra-control-hover text-terra-texto text-terra-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex-1 sm:flex-none"
              onClick={handleCancelar}
              disabled={guardando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-terra-boton bg-terra-primario hover:bg-terra-primario-oscuro text-white text-terra-xs font-bold transition-colors cursor-pointer disabled:opacity-50 shadow-terra-sm flex-1 sm:flex-none"
              disabled={guardando}
            >
              <Save size={16} />
              <span>{guardando ? 'Guardando cambios…' : 'Guardar cambios de perfil y dirección'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
