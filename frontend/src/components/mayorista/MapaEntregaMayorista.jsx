import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CheckCircle2, LocateFixed, MapPin, Navigation } from 'lucide-react';
import './MapaEntregaMayorista.css';

function parsearCoordenadas(gpsStr) {
  if (typeof gpsStr === 'string' && gpsStr.includes(',')) {
    const partes = gpsStr.split(',');
    const lat = parseFloat(partes[0].trim());
    const lng = parseFloat(partes[1].trim());
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return [lat, lng];
    }
  }
  // Coordenadas por defecto: Santa Cruz de la Sierra (Av. Banzer)
  return [-17.768924, -63.18241];
}

function crearIconoEntrega(razonSocial) {
  const nombreCorto = (razonSocial || 'Mi domicilio').slice(0, 24);
  const html = `
    <div class="leaflet-b2b-marker">
      <div class="leaflet-b2b-bubble">
        <span class="leaflet-b2b-dot"></span>
        <span class="leaflet-b2b-title">${nombreCorto}</span>
      </div>
      <div class="leaflet-b2b-pin">
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="white" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      </div>
      <div class="leaflet-b2b-shadow"></div>
    </div>
  `;

  return L.divIcon({
    className: 'leaflet-b2b-div-icon',
    html,
    iconSize: [160, 68],
    iconAnchor: [80, 66],
    popupAnchor: [0, -68],
  });
}

export default function MapaEntregaMayorista({
  gps,
  onGpsChange,
  razonSocial = 'Mi domicilio',
  direccion = '',
  cargandoGps = false,
  onObtenerGps,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [modoFijarActivo, setModoFijarActivo] = useState(false);

  // Inicializar mapa Leaflet una sola vez
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const coordsIniciales = parsearCoordenadas(gps);

    const map = L.map(mapContainerRef.current, {
      center: coordsIniciales,
      zoom: 15,
      zoomControl: false,
    });

    // Capa OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    // Controles de zoom abajo a la derecha
    L.control
      .zoom({
        position: 'bottomright',
      })
      .addTo(map);

    // Marcador del domicilio de entrega
    const marker = L.marker(coordsIniciales, {
      icon: crearIconoEntrega(razonSocial),
      draggable: true,
      autoPan: true,
    }).addTo(map);

    const actualizarPopup = (lat, lng) => {
      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4; min-width: 170px;">
          <strong style="color: #8B1D34; font-size: 13px; display: block; margin-bottom: 2px;">
            ${razonSocial || 'Mi domicilio'}
          </strong>
          <span style="color: #4b5563; display: block; margin-bottom: 6px;">
            ${direccion || 'Punto de entrega'}
          </span>
          <div style="display: inline-block; background: #ecfdf5; color: #047857; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; margin-bottom: 4px;">
            Ubicación de entrega registrada
          </div>
          <div style="font-family: monospace; font-size: 10px; color: #6b7280;">
            GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}
          </div>
        </div>
      `);
    };

    actualizarPopup(coordsIniciales[0], coordsIniciales[1]);

    // Evento al arrastrar el marcador
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      const nuevoGps = `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`;
      actualizarPopup(pos.lat, pos.lng);
      if (onGpsChange) onGpsChange(nuevoGps);
    });

    // Evento al hacer clic en cualquier parte del mapa
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      const nuevoGps = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      actualizarPopup(lat, lng);
      if (onGpsChange) onGpsChange(nuevoGps);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    // Asegurar tamaño correcto de renderizado tras montar
    const timeout = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(timeout);
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Actualizar icono cuando cambie la razón social
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setIcon(crearIconoEntrega(razonSocial));
    }
  }, [razonSocial]);

  // Si las coordenadas cambian externamente (ej: botón GPS)
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) return;
    const [lat, lng] = parsearCoordenadas(gps);
    const posActual = markerRef.current.getLatLng();
    const difLat = Math.abs(posActual.lat - lat);
    const difLng = Math.abs(posActual.lng - lng);

    if (difLat > 0.00001 || difLng > 0.00001) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 1.0 });
    }
  }, [gps]);

  // Actualizar popup cuando cambie la dirección o razón social
  useEffect(() => {
    if (!markerRef.current) return;
    const pos = markerRef.current.getLatLng();
    markerRef.current.bindPopup(`
      <div style="font-family: inherit; font-size: 12px; line-height: 1.4; min-width: 170px;">
        <strong style="color: #8B1D34; font-size: 13px; display: block; margin-bottom: 2px;">
          ${razonSocial || 'Mi domicilio'}
        </strong>
        <span style="color: #4b5563; display: block; margin-bottom: 6px;">
          ${direccion || 'Domicilio de entrega'}
        </span>
        <div style="display: inline-block; background: #ecfdf5; color: #047857; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; margin-bottom: 4px;">
          Ubicación de entrega
        </div>
        <div style="font-family: monospace; font-size: 10px; color: #6b7280;">
          GPS: ${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}
        </div>
      </div>
    `);
  }, [direccion, razonSocial]);

  const toggleModoFijar = () => {
    setModoFijarActivo((prev) => {
      const nuevoEstado = !prev;
      if (nuevoEstado && mapInstanceRef.current && markerRef.current) {
        const centro = mapInstanceRef.current.getCenter();
        markerRef.current.setLatLng(centro);
        const nuevoGps = `${centro.lat.toFixed(6)}, ${centro.lng.toFixed(6)}`;
        if (onGpsChange) onGpsChange(nuevoGps);
      }
      return nuevoEstado;
    });
  };

  return (
    <div className="flex flex-col gap-2 mt-2">
      {/* Barra de controles superiores del mapa */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
        <div className="flex items-center gap-2 flex-wrap">
          <strong className="text-terra-xs font-bold text-terra-texto">
            Ubicación de entrega en el mapa
          </strong>
          <span className="px-2.5 py-0.5 rounded-full text-terra-3xs font-mono font-bold bg-terra-control text-terra-texto border border-terra-borde">
            GPS: {gps || 'Sin definir'}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-terra-boton border border-terra-borde bg-terra-control hover:bg-terra-control-hover text-terra-texto text-terra-xs font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onObtenerGps}
            disabled={cargandoGps}
            title="Detectar coordenadas actuales"
          >
            <LocateFixed size={14} className="text-terra-primario dark:text-terra-acento" />
            <span>{cargandoGps ? 'Obteniendo GPS...' : 'Usar mi ubicación GPS actual'}</span>
          </button>

          <button
            type="button"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-terra-boton border text-terra-xs font-bold transition-colors cursor-pointer ${
              modoFijarActivo
                ? 'bg-terra-primario-suave border-terra-primario text-terra-primario dark:text-terra-acento'
                : 'bg-terra-control hover:bg-terra-control-hover border-terra-borde text-terra-texto'
            }`}
            onClick={toggleModoFijar}
            title="Haz clic en cualquier punto del mapa para mover el marcador"
          >
            <MapPin
              size={14}
              className={modoFijarActivo ? 'text-terra-primario dark:text-terra-acento' : 'text-terra-texto-suave'}
            />
            <span>{modoFijarActivo ? 'Modo selección activo (haz clic en el mapa)' : 'Fijar punto en el mapa'}</span>
          </button>
        </div>
      </div>

      {/* Indicador de ayuda al fijar punto */}
      {modoFijarActivo && (
        <div className="flex items-center gap-2 p-2.5 rounded-terra-campo bg-terra-primario-suave border border-terra-primario/30 text-terra-primario dark:text-terra-acento text-terra-xs font-semibold my-1">
          <Navigation size={13} className="shrink-0" />
          <span>Haz clic en cualquier punto del mapa o arrastra el marcador para fijar la ubicación de entrega.</span>
        </div>
      )}

      {/* Contenedor del mapa Leaflet */}
      <div className="relative w-full h-72 sm:h-80 rounded-terra-tarjeta overflow-hidden border border-terra-borde shadow-inner bg-terra-superficie-2">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Badge inferior de ubicación de entrega */}
        <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-2 px-3 py-1.5 rounded-terra-boton bg-terra-superficie/95 backdrop-blur-xs border border-terra-borde text-terra-3xs sm:text-terra-xs font-bold text-terra-texto shadow-terra-sm">
          <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Mapa interactivo: arrastra el pin o haz clic para marcar la ubicación de entrega</span>
        </div>
      </div>
    </div>
  );
}
