import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertTriangle, MapPinned, Route } from 'lucide-react';
import './MapaRutaDespacho.css';

const ORIGEN_TERRA = {
  direccion: 'Av. Carmelo Ortiz 3795, Santa Cruz de la Sierra',
  latitud: -17.7918472,
  longitud: -63.1527961,
};

function textoDistancia(metros) {
  return `${(Number(metros || 0) / 1000).toFixed(1)} km`;
}

function textoDuracion(segundos) {
  const minutos = Math.max(1, Math.round(Number(segundos || 0) / 60));
  return `${minutos} min`;
}

function iconoRuta(tipo, etiqueta) {
  return L.divIcon({
    className: 'dispatch-route-marker',
    html: `<span class="dispatch-route-marker__pin dispatch-route-marker__pin--${tipo}">${etiqueta}</span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function contenidoPopup(titulo, detalle) {
  const contenedor = document.createElement('div');
  const encabezado = document.createElement('strong');
  const texto = document.createElement('span');
  contenedor.className = 'dispatch-route-popup';
  encabezado.textContent = titulo;
  texto.textContent = detalle;
  contenedor.append(encabezado, texto);
  return contenedor;
}

export default function MapaRutaDespacho({ latitud, longitud, cliente = 'Cliente', direccion = '' }) {
  const contenedorRef = useRef(null);
  const mapaRef = useRef(null);
  const [estado, setEstado] = useState({ cargando: true, error: '', distancia: 0, duracion: 0 });

  useEffect(() => {
    const destino = [Number(latitud), Number(longitud)];
    if (!contenedorRef.current || !destino.every(Number.isFinite)) return undefined;

    const mapa = L.map(contenedorRef.current, { zoomControl: false, scrollWheelZoom: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(mapa);
    L.control.zoom({ position: 'bottomright' }).addTo(mapa);
    L.marker([ORIGEN_TERRA.latitud, ORIGEN_TERRA.longitud], { icon: iconoRuta('origen', 'T') })
      .bindPopup(contenidoPopup('TERRA', ORIGEN_TERRA.direccion))
      .addTo(mapa);
    L.marker(destino, { icon: iconoRuta('destino', 'D') })
      .bindPopup(contenidoPopup(cliente, direccion || 'Destino de entrega'))
      .addTo(mapa);
    mapa.fitBounds([ [ORIGEN_TERRA.latitud, ORIGEN_TERRA.longitud], destino ], { padding: [28, 28] });
    mapaRef.current = mapa;

    const controlador = new AbortController();
    setEstado({ cargando: true, error: '', distancia: 0, duracion: 0 });
    const origen = `${ORIGEN_TERRA.longitud},${ORIGEN_TERRA.latitud}`;
    const destinoOsrm = `${destino[1]},${destino[0]}`;
    fetch(`https://router.project-osrm.org/route/v1/driving/${origen};${destinoOsrm}?overview=full&geometries=geojson`, { signal: controlador.signal })
      .then((respuesta) => respuesta.ok ? respuesta.json() : Promise.reject(new Error('No se pudo calcular la ruta.')))
      .then((datos) => {
        const ruta = datos?.routes?.[0];
        if (!ruta?.geometry?.coordinates?.length) throw new Error('No se encontró una ruta para este destino.');
        const puntos = ruta.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        L.polyline(puntos, { className: 'dispatch-route-line', weight: 5 }).addTo(mapa);
        mapa.fitBounds(L.latLngBounds(puntos), { padding: [28, 28] });
        setEstado({ cargando: false, error: '', distancia: ruta.distance, duracion: ruta.duration });
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setEstado({ cargando: false, error: error.message || 'No se pudo cargar la ruta.', distancia: 0, duracion: 0 });
      });

    return () => {
      controlador.abort();
      mapa.remove();
      mapaRef.current = null;
    };
  }, [cliente, direccion, latitud, longitud]);

  return (
    <section className="dispatch-route" aria-label="Ruta de despacho">
      <header className="dispatch-route__header">
        <div><Route size={17} aria-hidden="true" /><span>Ruta desde TERRA</span></div>
        {estado.cargando && <small>Calculando con OSRM…</small>}
        {!estado.cargando && !estado.error && <small>{textoDistancia(estado.distancia)} · {textoDuracion(estado.duracion)}</small>}
      </header>
      <div ref={contenedorRef} className="dispatch-route__map" />
      {estado.error && <p className="dispatch-route__error"><AlertTriangle size={16} aria-hidden="true" />{estado.error}</p>}
      <p className="dispatch-route__legend"><MapPinned size={15} aria-hidden="true" />TERRA → {cliente}</p>
    </section>
  );
}
