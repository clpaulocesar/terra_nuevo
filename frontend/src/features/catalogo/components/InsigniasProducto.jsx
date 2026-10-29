import IconoMaterial from '../../../components/ui/IconoMaterial.jsx';

const COLORES = {
  oferta: 'bg-linear-135 from-terra-primario to-terra-oferta uppercase tracking-wider',
  promo: 'bg-terra-alerta',
  highlight: 'bg-terra-primario-oscuro',
  bestseller: 'bg-terra-primario',
  nuevo: 'bg-terra-ok',
  destacado: 'bg-terra-texto-suave',
};

// terra-badge: gancho de accesibilidad.css (texto en varias líneas y contraste).
function Insignia({ tipo, icono, children }) {
  return (
    <span
      className={`terra-badge inline-flex items-center gap-1.25 rounded-full px-2.5 py-1.25 text-terra-2xs font-black
        whitespace-nowrap text-terra-sobre-primario shadow-terra-insignia sm:text-xs ${COLORES[tipo]}`}
    >
      {icono && <IconoMaterial nombre={icono} className="text-2xl" />}
      {children}
    </span>
  );
}

// Insignias sobre la foto: oferta, más vendido, descuento y las que vienen del producto.
export default function InsigniasProducto({ producto, esMasVendido }) {
  const tipoBadge = producto.badge === 'Más Vendido' ? 'bestseller' : producto.badge === 'Nuevo' ? 'nuevo' : 'destacado';
  return (
    <div className="terra-card__badges absolute top-2.5 left-2.5 z-5 flex flex-col gap-1.5">
      {producto.nuevo_lanzamiento && (
        <Insignia tipo="nuevo" icono="new_releases">
          Nuevo lanzamiento
        </Insignia>
      )}
      {producto.en_oferta && (
        <Insignia tipo="oferta" icono="local_fire_department">
          Oferta{producto.descuento ? ` ${producto.descuento}` : ''}
        </Insignia>
      )}
      {esMasVendido && (
        <Insignia tipo="bestseller" icono="workspace_premium">
          Más vendido
        </Insignia>
      )}
      {producto.descuento && !producto.en_oferta && (
        <Insignia tipo="promo" icono="local_fire_department">
          {producto.descuento}
        </Insignia>
      )}
      {producto.badgeSecundario && <Insignia tipo="highlight">{producto.badgeSecundario}</Insignia>}
      {producto.badge && !producto.descuento && !producto.badgeSecundario && (
        <Insignia tipo={tipoBadge} icono={producto.badgeIcon}>
          {producto.badge}
        </Insignia>
      )}
    </div>
  );
}
