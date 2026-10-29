import { ChevronDown, FileText } from 'lucide-react';

const TEXTO_GENERICO = 'Diseño funcional y materiales de calidad para brindar confort a tu hogar todos los días.';

// Acordeón con la descripción completa. "Ver descripción completa" lo abre y baja hasta aquí.
export default function DescripcionCompleta({ descripcion, abierta, onAlternar }) {
  return (
    <section className="mt-4.5 scroll-mt-4" id="descripcion-completa">
      <div className="overflow-hidden rounded-terra-chico border border-terra-borde-suave bg-terra-superficie">
        <button
          type="button"
          className="flex w-full cursor-pointer items-center justify-between border-0 bg-terra-superficie px-4.5 py-3.75
            text-terra-sm font-extrabold text-terra-texto dark:hover:bg-terra-superficie-2"
          onClick={onAlternar}
          aria-expanded={abierta}
        >
          <span className="flex items-center gap-2">
            <FileText size={17} className="text-terra-primario" />
            Descripción completa
          </span>
          <ChevronDown
            size={18}
            className={`text-terra-primario transition-transform duration-200 motion-reduce:transition-none
              dark:text-terra-texto-suave ${abierta ? 'rotate-180' : ''}`}
          />
        </button>
        {abierta && (
          <div className="border-t border-terra-borde-suave px-4.5 py-3.5">
            <p className="text-terra-sm leading-relaxed whitespace-pre-line text-terra-texto-suave">
              {descripcion || TEXTO_GENERICO}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
