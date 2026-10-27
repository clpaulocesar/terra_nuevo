export const SUCURSALES_DATA = [
  {
    id: 'central',
    nombre: 'Sucursal Central',
    nombreCompleto: 'Sucursal Central (Barrio Lindo)',
    subtitulo: 'Av. Carmelo Ortiz #3795, entre 3er y 4to anillo (Zona Nueva Feria Barrio Lindo, paralela a las rieles del tren)',
    direccionCorta: 'Av. Carmelo Ortiz #3795',
    tag: 'Casa Matriz & Showroom',
    tagClass: 'bg-primary/10 text-primary',
    horario: 'Lun a Sáb: 08:00 - 20:00 | Dom: 09:00 - 15:00',
    stock: '100% de catálogo disponible',
    terminales: '3 terminales táctiles',
    stockKiosk: 'Stock Inmediato (9.912)',
    googleMapsUrl: 'https://www.google.com/search?kgmid=%2Fg%2F11c2kk62hb',
  },
  {
    id: 'norte',
    nombre: 'Sucursal Norte',
    nombreCompleto: 'Sucursal Norte (SEARPI)',
    subtitulo: '4to Anillo, entre Av. Alemana y Av. 2 de Agosto (Frente al SEARPI / Banco de Sangre)',
    direccionCorta: '4to Anillo entre Alemana y 2 de Agosto',
    tag: 'Showroom Zona Norte',
    tagClass: 'bg-surface-container-high text-on-surface-variant',
    horario: 'Lun a Sáb: 08:00 - 20:00 | Dom: 09:00 - 15:00',
    stock: 'Poltronas, Sommiers & Living',
    terminales: 'Retiro en sala disponible',
    stockKiosk: 'Stock en Sala (7.250)',
    googleMapsUrl: 'https://www.google.com/maps/search/TERRA+Muebles+Norte+Santa+Cruz+SEARPI',
  },
  {
    id: 'sur',
    nombre: 'Sucursal Sur',
    nombreCompleto: 'Sucursal Sur (Radial 10)',
    subtitulo: '4to Anillo, entre Radial 10 y Av. San Aurelio',
    direccionCorta: '4to Anillo entre Radial 10 y San Aurelio',
    tag: 'Showroom & Despacho Sur',
    tagClass: 'bg-secondary-fixed text-on-secondary-fixed',
    horario: 'Lun a Sáb: 08:00 - 20:00 | Dom: 09:00 - 15:00',
    stock: 'Colchones, Comedores & Confort',
    terminales: 'Andén de carga rápida',
    stockKiosk: 'Stock en Sala (6.840)',
    googleMapsUrl: 'https://www.google.com/search?kgmid=%2Fg%2F11qqrr9_31',
  },
];

export const LOGO_TERRA =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAePh4SgHLU3GyFfZdy8_Wldeef4TKuAMuTytBlrnJkIpE-56pAQ0daYQUn9-Aerb-JojsMLA9okiGStAb-9jZA_hXWJBglb2toHJhAjUY6qyxtG8UCzk5bIg3-VjUvi7e7bOt7kqhZMqwQuq6D8Rg0na8JDrrNU8am1isKsFUH2iW1t0kKkLfIVPCV7OJ0Cb2-ssEiVm4F8brkmPx-pgATv7fxGj-BnXz3W81FjWoJ0TM3gGkWi_A7Ew';

export function evaluarDisponibilidadSucursal(producto, sucursal) {
  if (!producto) {
    return {
      disponible: false,
      inmediato: false,
      stock: 0,
      textoStock: 'Consultar disponibilidad',
      badge: 'CONSULTAR',
      badgeClass: 'bg-surface-container text-on-surface-variant',
    };
  }

  const idSucursal = String(sucursal?.id || 'central').toLowerCase();
  const nombreSucursal = String(sucursal?.nombre || 'Central');

  // 1. Datos reales de producto_sucursales en PostgreSQL
  if (Array.isArray(producto.sucursales) && producto.sucursales.length > 0) {
    const sucursalItem = producto.sucursales.find((s) => {
      const nombreS = String(s.nombre || '').toLowerCase();
      const idS = String(s.id || '').toLowerCase();
      return (
        idS === idSucursal ||
        nombreS.includes(idSucursal) ||
        (idSucursal === 'central' && (nombreS.includes('central') || nombreS.includes('matriz') || nombreS.includes('barrio lindo'))) ||
        (idSucursal === 'norte' && (nombreS.includes('norte') || nombreS.includes('searpi'))) ||
        (idSucursal === 'sur' && (nombreS.includes('sur') || nombreS.includes('radial 10')))
      );
    });

    if (sucursalItem) {
      const stockNum = Number(sucursalItem.stock || 0);
      if (stockNum > 0) {
        return {
          disponible: true,
          inmediato: true,
          stock: stockNum,
          textoStock: 'Disponible para retiro inmediato',
          badge: 'RETIRO HOY',
          badgeClass: 'bg-tertiary-container text-on-tertiary-container font-bold',
        };
      }
    }

    // Stock general transferible
    const stockTotal = Number(producto.stock || producto.stock_quantity || 0);
    if (stockTotal > 0) {
      return {
        disponible: true,
        inmediato: false,
        stock: stockTotal,
        textoStock: 'Disponible para transferencia (24h)',
        badge: 'TRANSFERENCIA 24H',
        badgeClass: 'bg-surface-container-highest text-on-surface',
      };
    }
  }

  // 2. Campo textual de stock (reserva local y productos de catálogo inicial)
  const stockTexto = String(producto.stockTexto || producto.stock || '').toLowerCase();

  const enTodas =
    stockTexto.includes('3 sucursales') ||
    stockTexto.includes('todas') ||
    stockTexto.includes('100%');

  const enEsta =
    enTodas ||
    (idSucursal === 'central' && (stockTexto.includes('central') || stockTexto.includes('matriz'))) ||
    (idSucursal === 'norte' && stockTexto.includes('norte')) ||
    (idSucursal === 'sur' && stockTexto.includes('sur'));

  if (enEsta) {
    const unidades =
      typeof producto.stock === 'number' && producto.stock > 0
        ? producto.stock
        : idSucursal === 'central'
        ? 14
        : idSucursal === 'norte'
        ? 9
        : 7;

    return {
      disponible: true,
      inmediato: true,
      stock: unidades,
      textoStock: 'Disponible para retiro inmediato',
      badge: 'RETIRO HOY',
      badgeClass: 'bg-tertiary-container text-on-tertiary-container font-bold',
    };
  }

  // 3. Disponible en otra sucursal, programable para entrega en esta sala
  return {
    disponible: true,
    inmediato: false,
    stock: 0,
    textoStock: 'Disponible con transferencia (24h)',
    badge: 'TRANSFERENCIA 24H',
    badgeClass: 'bg-surface-container-highest text-on-surface',
  };
}
