import { useContext, useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  BadgeCheck,
  Building2,
  Camera,
  CheckCircle2,
  Home,
  Info,
  Loader2,
  Mail,
  PhoneCall,
  Save,
  Truck,
  Upload,
  User,
} from 'lucide-react';
import { SesionClienteContext } from '../context/SesionClienteContext.jsx';
import { actualizarPerfilMayorista } from '../services/sesionClienteService.js';
import { apiRequest } from '../services/api.js';
import MapaEntregaMayorista from '../components/mayorista/MapaEntregaMayorista.jsx';
import './PanelMayorista.css';

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
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [guardadoExito, setGuardadoExito] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [cargandoUbicacion, setCargandoUbicacion] = useState(false);
  const [cargandoDireccion, setCargandoDireccion] = useState(false);

  const fileInputRef = useRef(null);
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

  // Guardar cambios en Supabase y actualizar la sesión en memoria.
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

  // Cargar imagen o logo
  const handleFotoSeleccionada = (e) => {
    const archivo = e.target.files?.[0];
    if (archivo) {
      if (archivo.size > 5 * 1024 * 1024) {
        alert('La imagen seleccionada supera el límite de 5MB.');
        return;
      }
      const lector = new FileReader();
      lector.onload = () => setAvatarUrl(lector.result);
      lector.readAsDataURL(archivo);
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
    <div className="wholesale-profile-view">
      {/* ====================================================================
          1. HEADER CON BREADCRUMBS Y BOTONES DE ACCIÓN
          ==================================================================== */}
      <section className="b2b-profile-header">
        <div className="b2b-profile-header__info">
          <div className="b2b-breadcrumbs">
            <span className="b2b-breadcrumb-brand">Portal Mayorista</span>
            <span className="b2b-breadcrumb-sep">/</span>
            <span className="b2b-breadcrumb-current">Mi Cuenta</span>
          </div>
          <h1>Mi Perfil Mayorista</h1>
          <p>Actualiza tus datos de contacto comercial, facturación y la ubicación de tu domicilio para la entrega de tus pedidos.</p>
        </div>
        <div className="b2b-profile-header__actions">
          <button type="button" className="b2b-btn-cancel" onClick={handleCancelar} disabled={guardando}>
            Cancelar
          </button>
          <button type="button" className="b2b-btn-save" onClick={handleGuardar} disabled={guardando}>
            <CheckCircle2 size={17} />
            <span>{guardando ? 'Guardando…' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </section>

      {/* Alerta interactiva de confirmación */}
      {guardadoExito && (
        <div className="b2b-success-alert" role="status">
          <CheckCircle2 size={18} />
          <span>¡Datos de perfil comercial, facturación y dirección de envío actualizados correctamente!</span>
        </div>
      )}
      {errorGuardado && (
        <div className="b2b-success-alert" role="alert" style={{ background: '#fff1f2', borderColor: '#fecdd3', color: '#9f1239' }}>
          <Info size={18} />
          <span>{errorGuardado}</span>
        </div>
      )}

      {/* ====================================================================
          2. HERO CARD (AVATAR / LOGO CORPORATIVO & METADATOS)
          ==================================================================== */}
      <article className="b2b-profile-card">
        <div className="b2b-profile-card__content">
          <div className="b2b-avatar-wrap">
            <div className="b2b-avatar-box">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Logo Corporativo" />
              ) : (
                <>
                  <span className="b2b-avatar-initials">{iniciales}</span>
                  <span className="b2b-avatar-subtag">Mueblería</span>
                </>
              )}
            </div>
            <button
              type="button"
              className="b2b-avatar-cam-btn"
              title="Cambiar imagen corporativa"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera size={16} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg"
              style={{ display: 'none' }}
              onChange={handleFotoSeleccionada}
            />
          </div>

          <div className="b2b-profile-details">
            <div className="b2b-profile-title-row">
              <h2>{razonSocial}</h2>
              <span className="b2b-verified-badge">
                <BadgeCheck size={14} />
                Cliente Mayorista Autorizado
              </span>
            </div>
            <p className="b2b-profile-meta">
              <span style={{ fontWeight: 600, color: '#1f2937' }}>Titular: {nombreTitular}</span>
              <span>•</span>
              <span>
                NIT: <strong>{nit}</strong>
              </span>
              <span>•</span>
              <span>Santa Cruz, Bolivia</span>
            </p>
            <div className="b2b-upload-action-row">
              <button
                type="button"
                className="b2b-btn-upload-logo"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={14} />
                <span>Subir o cambiar foto / logo corporativo</span>
              </button>
              <span className="b2b-upload-hint">(PNG, JPG hasta 5MB)</span>
            </div>
          </div>
        </div>
      </article>

      {/* ====================================================================
          3. FORMULARIO PRINCIPAL
          ==================================================================== */}
      <form id="form-perfil-mayorista" onSubmit={handleGuardar} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* SECCIÓN A: Datos de Contacto y Representación Comercial */}
        <section className="b2b-form-section">
          <div className="b2b-form-section__header">
            <div className="b2b-section-title-wrap">
              <Building2 size={20} style={{ color: 'var(--terra-wine-b2b)' }} />
              <h3>Datos de Contacto y Representación Comercial</h3>
            </div>
          </div>

          <div className="b2b-fields-grid-2">
            {/* Nombre completo */}
            <div className="b2b-field-box">
              <label htmlFor="input-nombre">Nombre completo del encargado / titular</label>
              <div className="b2b-input-container">
                <span className="b2b-field-icon">
                  <User size={18} />
                </span>
                <input
                  id="input-nombre"
                  className="b2b-text-input"
                  required
                  type="text"
                  value={nombreTitular}
                  onChange={(e) => setNombreTitular(e.target.value)}
                />
              </div>
            </div>

            {/* Teléfono móvil */}
            <div className="b2b-field-box">
              <label htmlFor="input-telefono">Teléfono móvil / WhatsApp directo (Entrega)</label>
              <div className="b2b-input-container">
                <span className="b2b-field-icon" style={{ color: '#059669' }}>
                  <PhoneCall size={18} />
                </span>
                <input
                  id="input-telefono"
                  className="b2b-text-input"
                  style={{ fontFamily: 'monospace' }}
                  required
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </div>
              <p className="b2b-field-helper">Utilizado para coordinar la entrega de tu pedido.</p>
            </div>

            {/* Correo electrónico */}
            <div className="b2b-field-box">
              <label htmlFor="input-correo">Correo electrónico de facturación y notas de entrega</label>
              <div className="b2b-input-container">
                <span className="b2b-field-icon">
                  <Mail size={18} />
                </span>
                <input
                  id="input-correo"
                  className="b2b-text-input"
                  required
                  readOnly
                  title="El correo de acceso se gestiona con soporte TERRA"
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                />
              </div>
            </div>

            {/* Razón Social y NIT Comercial */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="b2b-field-box">
                <label htmlFor="input-razon">Razón Social</label>
                <input
                  id="input-razon"
                  className="b2b-text-input b2b-text-input--no-icon"
                  required
                  type="text"
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                />
              </div>
              <div className="b2b-field-box">
                <label htmlFor="input-nit">NIT Comercial</label>
                <input
                  id="input-nit"
                  className="b2b-text-input b2b-text-input--no-icon"
                  style={{ fontFamily: 'monospace', fontWeight: 700 }}
                  inputMode="numeric"
                  maxLength="20"
                  type="text"
                  value={nit}
                  onChange={(e) => setNit(e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECCIÓN B: Dirección de Envío */}
        <section className="b2b-form-section">
          <div className="b2b-form-section__header">
            <div className="b2b-section-title-wrap">
              <Truck size={20} style={{ color: 'var(--terra-wine-b2b)' }} />
              <div>
                <h3>Dirección de Envío</h3>
              </div>
            </div>
            <span className="b2b-verified-badge">
              <CheckCircle2 size={14} />
              Ubicación de entrega registrada
            </span>
          </div>

          <div className="b2b-fields-grid-2">
            {/* Dirección de envío / Domicilio */}
            <div className="b2b-field-box">
              <label htmlFor="input-direccion">Dirección de envío / Domicilio</label>
              <div className="b2b-input-container">
                <span className="b2b-field-icon">
                  {cargandoDireccion ? (
                    <Loader2 size={18} className="b2b-spinner-icon" style={{ color: 'var(--terra-wine-b2b)' }} />
                  ) : (
                    <Home size={18} />
                  )}
                </span>
                <input
                  id="input-direccion"
                  className="b2b-text-input"
                  placeholder="Ej.: Av. Banzer #123, Bartos"
                  required
                  maxLength="250"
                  type="text"
                  value={direccion}
                  onChange={handleDireccionChange}
                />
              </div>
              <p className="b2b-field-helper">
                {cargandoDireccion ? (
                  <span style={{ color: 'var(--terra-wine-b2b)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Loader2 size={12} className="b2b-spinner-icon" />
                    Detectando dirección automáticamente desde el mapa…
                  </span>
                ) : (
                  'Se completa y registra automáticamente al mover o hacer clic en el mapa. También puedes editarla manualmente.'
                )}
              </p>
            </div>

            {/* Referencias */}
            <div className="b2b-field-box">
              <label htmlFor="input-referencia">Referencia para ubicar tu domicilio</label>
              <div className="b2b-input-container">
                <span className="b2b-field-icon">
                  <Info size={18} />
                </span>
                <input
                  id="input-referencia"
                  className="b2b-text-input"
                  maxLength="250"
                  type="text"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Mapa Leaflet interactivo para registrar el domicilio de entrega */}
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
        <div className="b2b-profile-footer">
          <p className="b2b-sync-notice">
            <CheckCircle2 size={16} style={{ color: '#059669' }} />
            <span>Tus datos comerciales se mantienen sincronizados con tu cuenta mayorista de Terra Autoservicio.</span>
          </p>
          <div className="b2b-footer-actions">
            <button
              type="button"
              className="b2b-btn-cancel"
              style={{ flex: 1 }}
              onClick={handleCancelar}
              disabled={guardando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="b2b-btn-save"
              style={{ flex: 1, justifyContent: 'center' }}
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
