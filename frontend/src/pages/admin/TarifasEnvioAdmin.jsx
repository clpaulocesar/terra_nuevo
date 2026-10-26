import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Edit3,
  MapPin,
  MapPinned,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import {
  actualizarTarifaEnvio,
  crearTarifaEnvio,
  eliminarTarifaEnvio,
  listarTarifasEnvioAdmin,
} from '../../services/envioService.js';
import { formatoMoneda } from '../../utils/formatoMoneda.js';
import { avisoEliminado, avisoError, avisoExito, confirmarEliminacion } from '../../utils/alertas.js';
import './TarifasEnvioAdmin.css';

const TARIFA_VACIA = { nombre: '', costo: '', activo: true };

function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export default function TarifasEnvioAdmin() {
  const [tarifas, setTarifas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [buscar, setBuscar] = useState('');
  const [filtro, setFiltro] = useState('todas');
  const [editor, setEditor] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [conmutandoId, setConmutandoId] = useState(null);

  const cargarTarifas = async (silencioso = false) => {
    setError('');
    try {
      const datos = await listarTarifasEnvioAdmin();
      setTarifas(Array.isArray(datos) ? datos : []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las tarifas de envío.');
    } finally {
      if (!silencioso) setCargando(false);
    }
  };

  useEffect(() => {
    cargarTarifas();
  }, []);

  // Cierre accesible con tecla Escape
  useEffect(() => {
    if (!editor) return undefined;
    const alPresionarEscape = (event) => {
      if (event.key === 'Escape') setEditor(null);
    };
    window.addEventListener('keydown', alPresionarEscape);
    return () => window.removeEventListener('keydown', alPresionarEscape);
  }, [editor]);

  // Métricas para los KPIs
  const metricas = useMemo(() => {
    const total = tarifas.length;
    const activas = tarifas.filter((t) => t.activo).length;
    const inactivas = total - activas;
    const gratis = tarifas.filter((t) => t.activo && Number(t.costo) === 0).length;
    const sumaCostos = tarifas.reduce((acc, t) => acc + (Number(t.costo) || 0), 0);
    const promedio = total > 0 ? sumaCostos / total : 0;

    return { total, activas, inactivas, gratis, promedio };
  }, [tarifas]);

  // Lista filtrada
  const filtradas = useMemo(() => {
    const termino = normalizar(buscar);

    return tarifas.filter((tarifa) => {
      // Filtro de estado
      if (filtro === 'activas' && !tarifa.activo) return false;
      if (filtro === 'inactivas' && tarifa.activo) return false;
      if (filtro === 'gratis' && Number(tarifa.costo) !== 0) return false;

      // Búsqueda por texto
      if (!termino) return true;
      const nombreNorm = normalizar(tarifa.nombre);
      const costoTexto = String(tarifa.costo || '');
      return nombreNorm.includes(termino) || costoTexto.includes(termino);
    });
  }, [tarifas, buscar, filtro]);

  const guardar = async (event) => {
    event.preventDefault();
    const formulario = new FormData(event.currentTarget);
    const nombre = String(formulario.get('nombre') || '').trim();
    const costo = Number(formulario.get('costo'));
    const activo = formulario.get('activo') === 'on';

    if (!nombre) {
      await avisoError('Debes ingresar el nombre o descripción de la zona.');
      return;
    }

    if (Number.isNaN(costo) || costo < 0) {
      await avisoError('Ingresa un costo de envío válido (0 o mayor).');
      return;
    }

    const datos = { nombre, costo, activo };
    const esEdicion = Boolean(editor?.id);

    setGuardando(true);
    try {
      const guardada = esEdicion
        ? await actualizarTarifaEnvio(editor.id, datos)
        : await crearTarifaEnvio(datos);

      setTarifas((actuales) =>
        esEdicion
          ? actuales.map((t) => (t.id === guardada.id ? guardada : t))
          : [...actuales, guardada]
      );

      setEditor(null);
      await avisoExito({
        titulo: esEdicion ? '¡Tarifa actualizada!' : '¡Zona registrada!',
        texto: `La zona "${nombre}" se guardó correctamente con un costo de ${formatoMoneda(costo)}.`,
      });
    } catch (err) {
      await avisoError(err.message || 'No se pudo guardar la tarifa de envío.');
    } finally {
      setGuardando(false);
    }
  };

  const conmutarEstado = async (tarifa) => {
    const nuevoEstado = !tarifa.activo;
    setConmutandoId(tarifa.id);
    try {
      await actualizarTarifaEnvio(tarifa.id, {
        nombre: tarifa.nombre,
        costo: Number(tarifa.costo),
        activo: nuevoEstado,
      });

      setTarifas((actuales) =>
        actuales.map((item) => (item.id === tarifa.id ? { ...item, activo: nuevoEstado } : item))
      );
    } catch (err) {
      await avisoError(err.message || 'No se pudo cambiar el estado de la zona.');
    } finally {
      setConmutandoId(null);
    }
  };

  const eliminar = async (tarifa) => {
    const confirmado = await confirmarEliminacion({
      titulo: `¿Eliminar la zona "${tarifa.nombre}"?`,
      texto: 'Esta zona dejará de estar disponible. Los pedidos ya creados conservarán su historial.',
    });

    if (!confirmado) return;

    try {
      await eliminarTarifaEnvio(tarifa.id);
      setTarifas((actuales) => actuales.filter((item) => item.id !== tarifa.id));
      await avisoEliminado(`Zona "${tarifa.nombre}" eliminada exitosamente.`);
    } catch (err) {
      await avisoError(err.message || 'No se pudo eliminar la zona.');
    }
  };

  return (
    <section className="shipping-rates" aria-labelledby="shipping-rates-title">
      {/* Encabezado principal */}
      <header className="shipping-rates__hero">
        <div className="shipping-rates__hero-info">
          <div className="shipping-rates__badge">
            <Truck size={15} aria-hidden="true" />
            <span>Logística & Envíos</span>
          </div>
          <div className="shipping-rates__title-wrap">
            <h1 id="shipping-rates-title">Tarifas de envío</h1>
            <span className="shipping-rates__count-pill" title="Total de zonas configuradas">
              {tarifas.length} {tarifas.length === 1 ? 'zona' : 'zonas'}
            </span>
          </div>
          <p>
            Administrá zonas de entrega, barrios de cobertura y costos de transporte para pedidos a domicilio.
          </p>
        </div>

        <div className="shipping-rates__hero-actions">
          <button
            type="button"
            className="shipping-rates__btn-refresh"
            onClick={() => {
              setCargando(true);
              cargarTarifas(false);
            }}
            aria-label="Recargar tarifas"
            title="Recargar listado"
          >
            <RefreshCw size={17} className={cargando ? 'is-spinning' : ''} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="shipping-rates__btn-primary"
            onClick={() => setEditor(TARIFA_VACIA)}
          >
            <Plus size={18} aria-hidden="true" />
            <span>Nueva zona</span>
          </button>
        </div>
      </header>

      {/* Tarjetas KPI */}
      <section className="shipping-rates__summary" aria-label="Resumen de logística">
        <article className="shipping-rates__kpi-card">
          <div className="shipping-rates__kpi-icon shipping-rates__kpi-icon--burgundy">
            <MapPinned size={22} aria-hidden="true" />
          </div>
          <div className="shipping-rates__kpi-content">
            <small>Zonas registradas</small>
            <b>{metricas.total}</b>
            <span>Cobertura configurada</span>
          </div>
        </article>

        <article className="shipping-rates__kpi-card">
          <div className="shipping-rates__kpi-icon shipping-rates__kpi-icon--emerald">
            <CheckCircle2 size={22} aria-hidden="true" />
          </div>
          <div className="shipping-rates__kpi-content">
            <small>Disponibles al cliente</small>
            <b>{metricas.activas}</b>
            <span>Visibles en el checkout</span>
          </div>
        </article>

        <article className="shipping-rates__kpi-card">
          <div className="shipping-rates__kpi-icon shipping-rates__kpi-icon--amber">
            <AlertCircle size={22} aria-hidden="true" />
          </div>
          <div className="shipping-rates__kpi-content">
            <small>En pausa / Ocultas</small>
            <b>{metricas.inactivas}</b>
            <span>Desactivadas temporalmente</span>
          </div>
        </article>

        <article className="shipping-rates__kpi-card">
          <div className="shipping-rates__kpi-icon shipping-rates__kpi-icon--indigo">
            <Banknote size={22} aria-hidden="true" />
          </div>
          <div className="shipping-rates__kpi-content">
            <small>Tarifa promedio</small>
            <b>{formatoMoneda(metricas.promedio)}</b>
            <span>Costo medio de transporte</span>
          </div>
        </article>
      </section>

      {/* Barra de Búsqueda y Filtros */}
      <section className="shipping-rates__toolbar" aria-label="Búsqueda y filtros">
        <label className="shipping-rates__search-wrap">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            placeholder="Buscar por zona, barrio, anillo o precio…"
            aria-label="Buscar zona o tarifa"
          />
          {buscar && (
            <button
              type="button"
              className="shipping-rates__search-clear"
              onClick={() => setBuscar('')}
              aria-label="Limpiar búsqueda"
            >
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </label>

        <nav className="shipping-rates__pills" aria-label="Filtro por estado de zona">
          <button
            type="button"
            className={filtro === 'todas' ? 'is-active' : ''}
            onClick={() => setFiltro('todas')}
          >
            Todas <em>({metricas.total})</em>
          </button>
          <button
            type="button"
            className={filtro === 'activas' ? 'is-active' : ''}
            onClick={() => setFiltro('activas')}
          >
            Activas <em>({metricas.activas})</em>
          </button>
          <button
            type="button"
            className={filtro === 'inactivas' ? 'is-active' : ''}
            onClick={() => setFiltro('inactivas')}
          >
            Ocultas <em>({metricas.inactivas})</em>
          </button>
          {metricas.gratis > 0 && (
            <button
              type="button"
              className={filtro === 'gratis' ? 'is-active' : ''}
              onClick={() => setFiltro('gratis')}
            >
              Envío Gratis <em>({metricas.gratis})</em>
            </button>
          )}
        </nav>
      </section>

      {/* Alerta de error si ocurre */}
      {error && (
        <div className="shipping-rates__error" role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          <span>{error}</span>
          <button type="button" onClick={() => cargarTarifas(false)}>Reintentar</button>
        </div>
      )}

      {/* Tabla principal */}
      <section className="shipping-rates__table-card">
        <header className="shipping-rates__table-header">
          <div>
            <h2>Listado de Zonas y Costos</h2>
            <p>
              Mostrando {filtradas.length} de {tarifas.length} zonas configuradas en el sistema.
            </p>
          </div>
        </header>

        {cargando ? (
          <div className="shipping-rates__loading">
            <RefreshCw size={26} className="is-spinning" aria-hidden="true" />
            <p>Cargando tarifas de envío…</p>
          </div>
        ) : filtradas.length === 0 ? (
          <div className="shipping-rates__empty">
            <MapPin size={42} aria-hidden="true" />
            <h3>No se encontraron zonas</h3>
            <p>
              {buscar || filtro !== 'todas'
                ? 'No hay zonas que coincidan con los filtros aplicados.'
                : 'Todavía no hay zonas de envío registradas en el sistema.'}
            </p>
            {(buscar || filtro !== 'todas') && (
              <button
                type="button"
                className="shipping-rates__btn-secondary"
                onClick={() => {
                  setBuscar('');
                  setFiltro('todas');
                }}
              >
                Restablecer filtros
              </button>
            )}
          </div>
        ) : (
          <div className="shipping-rates__scroll">
            <table className="shipping-rates__table">
              <thead>
                <tr>
                  <th scope="col">Zona o Barrio</th>
                  <th scope="col">Costo de Transporte</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Disponibilidad Rápida</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((tarifa) => {
                  const esGratis = Number(tarifa.costo) === 0;
                  const cambiandoEste = conmutandoId === tarifa.id;

                  return (
                    <tr key={tarifa.id} className={!tarifa.activo ? 'is-inactive-row' : ''}>
                      <td>
                        <div className="shipping-rates__place">
                          <span className="shipping-rates__pin-badge" aria-hidden="true">
                            <MapPin size={17} />
                          </span>
                          <div className="shipping-rates__place-texts">
                            <b>{tarifa.nombre}</b>
                            <small>Destino para despacho a domicilio</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        {esGratis ? (
                          <span className="shipping-rates__free-pill">
                            Envío Gratis (Bs 0)
                          </span>
                        ) : (
                          <div className="shipping-rates__price">
                            <b>{formatoMoneda(tarifa.costo)}</b>
                          </div>
                        )}
                      </td>

                      <td>
                        <span
                          className={`shipping-rates__status ${
                            tarifa.activo ? 'is-active' : 'is-inactive'
                          }`}
                        >
                          <i aria-hidden="true" />
                          {tarifa.activo ? 'Activa' : 'Oculta'}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className={`shipping-rates__toggle-btn ${
                            tarifa.activo ? 'is-enabled' : 'is-disabled'
                          }`}
                          onClick={() => conmutarEstado(tarifa)}
                          disabled={cambiandoEste}
                          aria-label={`${
                            tarifa.activo ? 'Desactivar' : 'Activar'
                          } disponibilidad de ${tarifa.nombre}`}
                          title={`Clic para ${
                            tarifa.activo ? 'pausar' : 'activar'
                          } esta zona`}
                        >
                          <span className="shipping-rates__toggle-switch" />
                          <small>{tarifa.activo ? 'Disponible' : 'Pausada'}</small>
                        </button>
                      </td>

                      <td>
                        <div className="shipping-rates__actions">
                          <button
                            type="button"
                            className="shipping-rates__action-btn"
                            onClick={() => setEditor(tarifa)}
                            aria-label={`Editar tarifa de ${tarifa.nombre}`}
                            title="Editar tarifa"
                          >
                            <Edit3 size={16} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="shipping-rates__action-btn is-danger"
                            onClick={() => eliminar(tarifa)}
                            aria-label={`Eliminar zona ${tarifa.nombre}`}
                            title="Eliminar zona"
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal de Crear / Editar Zona */}
      {editor && (
        <div
          className="shipping-rates__modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-editor-tarifa"
        >
          <button
            type="button"
            className="shipping-rates__modal-backdrop"
            onClick={() => setEditor(null)}
            aria-label="Cerrar modal de tarifa"
            tabIndex={-1}
          />
          <div className="shipping-rates__modal-card">
            <header className="shipping-rates__modal-header">
              <div className="shipping-rates__modal-badge-title">
                <span className="shipping-rates__modal-icon" aria-hidden="true">
                  <Truck size={20} />
                </span>
                <div>
                  <h2 id="titulo-editor-tarifa">
                    {editor.id ? 'Editar Zona de Envío' : 'Nueva Zona de Envío'}
                  </h2>
                  <p>Configurá la zona de cobertura y el costo de transporte.</p>
                </div>
              </div>
              <button
                type="button"
                className="shipping-rates__modal-close"
                onClick={() => setEditor(null)}
                aria-label="Cerrar modal"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </header>

            <form onSubmit={guardar} className="shipping-rates__modal-form">
              <label className="shipping-rates__field">
                <span>Zona, barrios o anillo</span>
                <input
                  name="nombre"
                  defaultValue={editor.nombre}
                  placeholder="Ej. Equipetrol, Villa 1ro de Mayo, Urubó…"
                  maxLength={180}
                  required
                />
                <small>Escribe barrios o zonas representativas para que el cliente la identifique.</small>
              </label>

              <label className="shipping-rates__field">
                <span>Costo de envío (en Bolivianos)</span>
                <div className="shipping-rates__input-prefix">
                  <span aria-hidden="true">Bs</span>
                  <input
                    name="costo"
                    type="number"
                    min="0"
                    max="10000"
                    step="0.50"
                    defaultValue={editor.costo !== '' ? editor.costo : '0'}
                    placeholder="0.00"
                    required
                  />
                </div>
                <small>Ingresa 0 para ofrecer envío sin costo (gratis) en esta zona.</small>
              </label>

              <label className="shipping-rates__field-toggle" aria-label="Zona disponible para clientes">
                <input
                  name="activo"
                  type="checkbox"
                  defaultChecked={editor.activo}
                  aria-label="Zona disponible para clientes"
                />
                <div>
                  <b>Zona disponible para clientes</b>
                  <p>Si la desactivas, los clientes no podrán seleccionarla en el autoservicio.</p>
                </div>
              </label>

              <footer className="shipping-rates__modal-footer">
                <button
                  type="button"
                  className="shipping-rates__btn-secondary"
                  onClick={() => setEditor(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="shipping-rates__btn-primary"
                  disabled={guardando}
                >
                  {guardando ? (
                    <>
                      <RefreshCw size={16} className="is-spinning" aria-hidden="true" />
                      <span>Guardando…</span>
                    </>
                  ) : (
                    <span>{editor.id ? 'Guardar Cambios' : 'Registrar Zona'}</span>
                  )}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
