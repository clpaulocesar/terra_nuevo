import IconoMaterial from '../../../components/ui/IconoMaterial.jsx';

// "Agregar al carrito"; tras agregar muestra "¡Agregado!" en verde un momento.
// terra-btn-agregar: gancho de accesibilidad.css (foco y contraste).
export default function BotonAgregarCarrito({ agregado, deshabilitado, onClick, ...resto }) {
  return (
    <button
      type="button"
      disabled={deshabilitado}
      onClick={onClick}
      className={`terra-btn-agregar flex min-h-11 w-full items-center justify-center gap-1.25 rounded-terra-boton px-1.5
        py-1 text-center text-terra-xs leading-terra-boton font-black text-terra-sobre-primario transition duration-400
        enabled:active:scale-96 disabled:cursor-not-allowed disabled:bg-terra-deshabilitado
        disabled:text-terra-sobre-primario/70 disabled:shadow-none sm:min-h-12 sm:gap-2 sm:px-2.5 sm:py-1.5
        sm:text-terra-md ${agregado ? 'bg-terra-ok shadow-none' : 'bg-terra-primario shadow-terra-sm'}`}
      {...resto}
    >
      <IconoMaterial nombre={agregado ? 'done' : 'add_shopping_cart'} className="text-2xl" />
      <span className="font-black">{agregado ? '¡Agregado!' : 'Agregar al carrito'}</span>
    </button>
  );
}
