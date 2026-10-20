import { useContext, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  BadgeCheck,
  Building2,
  Camera,
  CheckCircle2,
  Info,
  Mail,
  PhoneCall,
  Save,
  Store,
  Truck,
  Upload,
  User,
} from 'lucide-react';
import { SesionClienteContext } from '../context/SesionClienteContext.jsx';
import MapaEntregaMayorista from '../components/mayorista/MapaEntregaMayorista.jsx';
import './PanelMayorista.css';

export default function PanelMayorista() {
  const { sesion, esMayorista, iniciarSesion } = useContext(SesionClienteContext);

  // Estados del formulario inicializados con datos de sesión o valores B2B institucionales
  const [nombreTitular, setNombreTitular] = useState(
    sesion?.titular || sesion?.nombre || 'Ana Patricia Valdivia Roca'
  );
  const [telefono, setTelefono] = useState(sesion?.telefono || '+591 710 44520');
  const [correo, setCorreo] = useState(sesion?.email || 'ana.valdivia@muebleriavaldivia.bo');
  const [razonSocial, setRazonSocial] = useState(sesion?.nombre || 'Mueblería Valdivia S.R.L.');
  const [nit, setNit] = useState(sesion?.nit || '67874236');
  const [direccion, setDireccion] = useState('Av. Banzer entre 3er y 4to Anillo #1420, Almacén Central');
  const [referencia, setReferencia] = useState('Portón azul frente a Surtidor Genex, timbre almacén rampa 2');
  const [gps, setGps] = useState('-17.768924, -63.182410');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [guardadoExito, setGuardadoExito] = useState(false);
  const [cargandoUbicacion, setCargandoUbicacion] = useState(false);

  const fileInputRef = useRef(null);

  if (!esMayorista) return <Navigate to="/catalogo" replace />;

  // Generar iniciales a partir de la Razón Social o Nombre
  const iniciales = String(razonSocial || 'MV')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();

  // Guardar cambios
  const handleGuardar = (e) => {
    if (e) e.preventDefault();
    if (iniciarSesion && sesion) {
      iniciarSesion({
        ...sesion,
        nombre: razonSocial,
        titular: nombreTitular,
        email: correo,
        telefono,
        nit,
      });
    }
    setGuardadoExito(true);
    setTimeout(() => setGuardadoExito(false), 4500);
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
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
        setCargandoUbicacion(false);
      },
      () => {
        setGps('-17.768924, -63.182410');
        setCargandoUbicacion(false);
      },
      { timeout: 7000 }
    );
  };

  // Cancelar / Restablecer
  const handleCancelar = () => {
    setNombreTitular(sesion?.titular || sesion?.nombre || 'Ana Patricia Valdivia Roca');
    setTelefono(sesion?.telefono || '+591 710 44520');
    setCorreo(sesion?.email || 'ana.valdivia@muebleriavaldivia.bo');
    setRazonSocial(sesion?.nombre || 'Mueblería Valdivia S.R.L.');
    setNit(sesion?.nit || '67874236');
    setDireccion('Av. Banzer entre 3er y 4to Anillo #1420, Almacén Central');
    setReferencia('Portón azul frente a Surtidor Genex, timbre almacén rampa 2');
    setGuardadoExito(false);
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
          <p>Actualiza tus datos de contacto comercial, facturación y ubicación de entrega para despachos.</p>
        </div>
        <div className="b2b-profile-header__actions">
          <button type="button" className="b2b-btn-cancel" onClick={handleCancelar}>
            Cancelar
          </button>
          <button type="button" className="b2b-btn-save" onClick={handleGuardar}>
            <CheckCircle2 size={17} />
            <span>Guardar Cambios</span>
          </button>
        </div>
      </section>

      {/* Alerta interactiva de confirmación */}
      {guardadoExito && (
        <div className="b2b-success-alert" role="status">
          <CheckCircle2 size={18} />
          <span>¡Datos de perfil comercial, facturación y despacho actualizados correctamente!</span>
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
              <label htmlFor="input-telefono">Teléfono móvil / WhatsApp directo (Despachos)</label>
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
              <p className="b2b-field-helper">Utilizado para la coordinación del chofer antes de la descarga.</p>
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
                  required
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
            {/* Dirección escrita */}
            <div className="b2b-field-box">
              <label htmlFor="input-direccion">Dirección escrita de almacén / sucursal</label>
              <div className="b2b-input-container">
                <span className="b2b-field-icon">
                  <Store size={18} />
                </span>
                <input
                  id="input-direccion"
                  className="b2b-text-input"
                  required
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                />
              </div>
            </div>

            {/* Referencias */}
            <div className="b2b-field-box">
              <label htmlFor="input-referencia">Referencias para el chofer y estibadores</label>
              <div className="b2b-input-container">
                <span className="b2b-field-icon">
                  <Info size={18} />
                </span>
                <input
                  id="input-referencia"
                  className="b2b-text-input"
                  type="text"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Mapa Leaflet interactivo para georreferenciación de almacén y entrega */}
          <MapaEntregaMayorista
            gps={gps}
            onGpsChange={setGps}
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
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="b2b-btn-save"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <Save size={16} />
              <span>Guardar cambios de perfil y dirección</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
