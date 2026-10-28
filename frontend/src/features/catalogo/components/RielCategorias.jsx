import { forwardRef } from 'react';
import ChipCategoria from './ChipCategoria.jsx';
import MenuCategorias from './MenuCategorias.jsx';

// Anchos del esqueleto mientras llegan las categorías.
const ANCHOS_ESQUELETO = [110, 150, 130, 140];

// Riel horizontal: selector con todas las categorías, chip "Ofertas", las primeras
// categorías y "+N más".
const RielCategorias = forwardRef(function RielCategorias(
  {
    cargando, categorias, categoriasEnRiel, totalCategorias, categoriaActivaFuera, categoriaSeleccionada,
    esActiva, soloOfertas, menuAbierto, visibles, onAlternarMenu, onCerrarMenu, onAbrirMenu, onElegir, onAlternarOfertas,
  },
  refMenu,
) {
  return (
    <div className="mx-auto mt-3 mb-2 max-w-terra px-4 sm:mt-0 sm:mb-3">
      <div
        className={`flex gap-2 overflow-x-auto pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
          ${menuAbierto ? 'lg:overflow-visible' : ''}`}
      >
        {cargando ? (
          ANCHOS_ESQUELETO.map((ancho) => (
            <span
              key={ancho}
              aria-hidden="true"
              style={{ width: ancho }}
              className="h-11 shrink-0 animate-terra-latido rounded-full bg-terra-esqueleto motion-reduce:animate-none"
            />
          ))
        ) : (
          <>
            <MenuCategorias
              ref={refMenu}
              categorias={categorias}
              totalCategorias={totalCategorias}
              categoriaActiva={categoriaActivaFuera}
              esActiva={esActiva}
              todasSeleccionadas={!categoriaSeleccionada}
              abierto={menuAbierto}
              onAlternar={onAlternarMenu}
              onCerrar={onCerrarMenu}
              onElegir={onElegir}
            />

            <ChipCategoria
              variante="ofertas"
              icono="local_fire_department"
              etiqueta="Ofertas"
              activo={soloOfertas}
              punto={soloOfertas}
              data-tour="ofertas"
              aria-pressed={soloOfertas}
              onClick={onAlternarOfertas}
            />

            {categoriasEnRiel.map((cat) => {
              const activa = esActiva(cat.id);
              return (
                <ChipCategoria
                  key={cat.id}
                  icono={cat.icon}
                  etiqueta={cat.nombre}
                  activo={activa}
                  punto={activa}
                  aria-label={`Categoría ${cat.nombre}`}
                  aria-pressed={activa}
                  onClick={() => onElegir(activa ? '' : cat.id)}
                />
              );
            })}

            {categorias.length > visibles && (
              <ChipCategoria
                variante="mas"
                icono="more_horiz"
                etiqueta={`+${categorias.length - visibles} más`}
                onClick={onAbrirMenu}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
});

export default RielCategorias;
