import { forwardRef } from 'react';
import IconoMaterial from '../../../components/ui/IconoMaterial.jsx';
import ChipCategoria from './ChipCategoria.jsx';

// Selector con todas las categorías. En escritorio cuelga del chip; en teléfono y
// tablet es una hoja inferior a todo el ancho, con fondo oscuro, asa y botón cerrar.
const MenuCategorias = forwardRef(function MenuCategorias(
  { categorias, totalCategorias, categoriaActiva, esActiva, todasSeleccionadas, abierto, onAlternar, onCerrar, onElegir },
  ref,
) {
  return (
    <div className="relative flex-none" ref={ref} data-tour="categorias">
      <ChipCategoria
        variante="selector"
        activo={Boolean(categoriaActiva) || abierto}
        icono={categoriaActiva ? categoriaActiva.icon : 'category'}
        etiqueta={categoriaActiva ? categoriaActiva.nombre : 'Categorías'}
        flecha={abierto ? 'expand_less' : 'expand_more'}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        onClick={onAlternar}
      />

      {abierto && (
        <>
          <div
            aria-hidden="true"
            className="fixed inset-0 z-90 animate-terra-aparecer bg-terra-velo motion-reduce:animate-none lg:hidden"
            onClick={onCerrar}
          />
          <div
            role="listbox"
            aria-label="Elegir categoría"
            className="fixed inset-x-0 bottom-0 z-95 max-h-[78vh] w-full max-w-[100vw] animate-terra-hoja overflow-x-hidden
              overflow-y-auto rounded-t-[22px] bg-terra-superficie px-2.5 pt-1.5 text-terra-texto
              pb-[calc(14px+env(safe-area-inset-bottom,0px))] shadow-[0_-16px_40px_rgba(0,0,0,0.25)]
              motion-reduce:animate-none lg:absolute lg:inset-x-auto lg:top-[calc(100%+8px)] lg:bottom-auto lg:left-0
              lg:z-70 lg:max-h-[min(60vh,460px)] lg:w-75 lg:animate-terra-aparecer lg:rounded-terra lg:border
              lg:border-terra-borde lg:p-1.5 lg:shadow-terra"
          >
            <span aria-hidden="true" className="mx-auto mt-1.5 mb-2.5 block h-1.25 w-11 rounded-full bg-terra-borde lg:hidden" />
            <div
              className="sticky top-0 z-1 flex items-center justify-between gap-2.5 bg-terra-superficie px-1.5 pt-1 pb-2.5
                text-base font-black text-terra-texto dark:text-terra-texto-suave lg:static lg:gap-0 lg:px-3 lg:pt-2
                lg:pb-1.5 lg:text-xs lg:font-extrabold lg:tracking-[0.08em] lg:text-terra-texto-suave lg:uppercase"
            >
              <span>Categorías</span>
              <small className="ml-auto text-terra-2xs font-bold tracking-normal text-terra-texto-suave normal-case">
                {categorias.length} líneas
              </small>
              <button
                type="button"
                className="inline-flex size-9.5 items-center justify-center rounded-full bg-terra-primario-suave
                  text-terra-primario-oscuro dark:bg-terra-primario-claro dark:text-terra-acento lg:hidden"
                aria-label="Cerrar categorías"
                onClick={onCerrar}
              >
                <IconoMaterial nombre="close" className="text-xl" />
              </button>
            </div>
            <ItemCategoria
              icono="apps"
              nombre="Todos los productos"
              total={totalCategorias > 0 ? totalCategorias : null}
              activa={todasSeleccionadas}
              onClick={() => onElegir('')}
            />
            {categorias.map((cat) => {
              const activa = esActiva(cat.id);
              return (
                <ItemCategoria
                  key={cat.id}
                  icono={cat.icon}
                  nombre={cat.nombre}
                  total={Number.isFinite(Number(cat.total)) ? cat.total : null}
                  activa={activa}
                  onClick={() => onElegir(activa ? '' : cat.id)}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
});

export default MenuCategorias;

function ItemCategoria({ icono, nombre, total, activa, onClick }) {
  const estado = activa
    ? 'bg-terra-primario text-terra-sobre-primario hover:bg-terra-primario-oscuro'
    : 'bg-transparent text-terra-texto hover:bg-terra-primario-suave dark:hover:bg-terra-control-hover';
  return (
    <button
      type="button"
      role="option"
      aria-selected={activa}
      onClick={onClick}
      className={`flex min-h-13 w-full items-center gap-3 rounded-terra-boton px-3 py-2.5 text-left text-base
        font-extrabold transition duration-250 active:scale-98 lg:min-h-11.5 lg:gap-2.5 lg:py-2 lg:text-terra-md ${estado}`}
    >
      <IconoMaterial
        nombre={icono}
        className={`text-terra-icono-lg lg:text-xl ${activa ? 'text-terra-sobre-primario' : 'text-terra-acento'}`}
      />
      <span className="min-w-0 flex-1 leading-tight lg:truncate lg:leading-normal">{nombre}</span>
      {total !== null && (
        <span
          className={`flex-none rounded-full px-2.5 py-0.75 text-terra-xs font-black lg:px-2 lg:py-0.5 lg:text-xs
            ${activa
              ? 'bg-terra-sobre-primario/22 text-terra-sobre-primario'
              : 'bg-terra-primario-suave text-terra-primario-oscuro dark:bg-terra-primario-claro dark:text-terra-acento'}`}
        >
          {total}
        </span>
      )}
      {activa && <IconoMaterial nombre="done" className="text-lg" />}
    </button>
  );
}
