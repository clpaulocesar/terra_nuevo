import EnlaceVolver from '../../../components/ui/EnlaceVolver.jsx';

export default function EncabezadoCarrito() {
  return (
    <header className="flex flex-col items-start gap-2 max-sm:p-2 sm:gap-3.5">
      <EnlaceVolver to="/catalogo">Volver al catálogo</EnlaceVolver>
      <div>
        <h1
          className="m-0 text-terra-titulo-movil font-black tracking-terra-titulo sm:mt-3 sm:mb-1.5
            sm:text-terra-titulo"
        >
          Revisá tu pedido
        </h1>
        <p className="m-0 max-w-[62ch] text-base text-terra-texto-suave">
          Verificá tus artículos antes de generar el ticket para pagar en caja.
        </p>
      </div>
    </header>
  );
}
