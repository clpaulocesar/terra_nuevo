import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CheckCircle2, LocateFixed, MapPin, Navigation } from 'lucide-react';

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
            ${direccion || 'Domicilio de entrega'}
          </span>
          <div style="display: inline-block; background: #ecfdf5; color: #047857; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; margin-bottom: 4px;">
            Ubicación de entrega
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
    <div className="b2b-leaflet-wrapper">
      {/* Barra de controles superiores del mapa */}
      <div className="b2b-map-controls-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <strong style={{ fontSize: '0.75rem', color: '#374151' }}>Ubicación de entrega en el mapa</strong>
          <span className="b2b-gps-badge">GPS: {gps || 'Sin definir'}</span>
        </div>

        <div className="b2b-map-action-buttons">
          <button
            type="button"
            className="b2b-btn-map-action"
            onClick={onObtenerGps}
            disabled={cargandoGps}
            title="Detectar coordenadas actuales"
          >
            <LocateFixed size={14} style={{ color: 'var(--terra-wine-b2b)' }} />
            <span>{cargandoGps ? 'Obteniendo GPS...' : 'Usar mi ubicación GPS actual'}</span>
          </button>

          <button
            type="button"
            className={`b2b-btn-map-action ${modoFijarActivo ? 'b2b-btn-map-action--active' : ''}`}
            onClick={toggleModoFijar}
            title="Haz clic en cualquier punto del mapa para mover el marcador"
          >
            <MapPin size={14} style={{ color: modoFijarActivo ? 'var(--terra-wine-b2b)' : '#6b7280' }} />
            <span>{modoFijarActivo ? 'Modo selección activo (haz clic en el mapa)' : 'Fijar punto en el mapa'}</span>
          </button>
        </div>
      </div>

      {/* Indicador de ayuda al fijar punto */}
      {modoFijarActivo && (
        <div className="b2b-map-hint-banner">
          <Navigation size={13} style={{ color: 'var(--terra-wine-b2b)' }} />
          <span>Haz clic en cualquier punto del mapa o arrastra el marcador para fijar la ubicación de tu domicilio.</span>
        </div>
      )}

      {/* Contenedor del mapa Leaflet */}
      <div className="b2b-leaflet-container-frame">
        <div ref={mapContainerRef} className="b2b-leaflet-map-element" />

        {/* Badge inferior de ubicación de entrega */}
        <div className="b2b-map-truck-legend">
          <CheckCircle2 size={13} style={{ color: '#059669' }} />
          <span>Mapa interactivo: arrastra el pin o haz clic para marcar tu domicilio</span>
        </div>
      </div>
    </div>
  );
}
