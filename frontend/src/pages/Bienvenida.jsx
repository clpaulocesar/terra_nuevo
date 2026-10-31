import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, CreditCard, ShieldCheck, ShoppingBag, Sofa, Truck } from 'lucide-react';

const garantias = [
  { icono: Truck, texto: 'Pedido en Línea' },
  { icono: ShieldCheck, texto: 'Garantía oficial de Terra' },
  { icono: CreditCard, texto: 'Pago seguro en caja' },
];

const fotosPoltronas = [
  { src: '/images/inicio/poltrona1.webp', alt: 'Poltrona TERRA modelo 1' },
  { src: '/images/inicio/poltrona2.webp', alt: 'Poltrona TERRA modelo 2' },
  { src: '/images/inicio/poltrona3.webp', alt: 'Poltrona TERRA modelo 3' },
  { src: '/images/inicio/sofacama1.webp', alt: 'Sofá cama TERRA modelo 1' },
  { src: '/images/inicio/sofacama2.webp', alt: 'Sofá cama TERRA modelo 2' },
  { src: '/images/inicio/sofacama3.webp', alt: 'Sofá cama TERRA modelo 3' },
];

export default function Bienvenida() {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndice((i) => (i + 1) % fotosPoltronas.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const anterior = () => setIndice((i) => (i - 1 + fotosPoltronas.length) % fotosPoltronas.length);
  const siguiente = () => setIndice((i) => (i + 1) % fotosPoltronas.length);

  return (
    <div
      className="flex flex-1 flex-col justify-between font-terra py-2 sm:py-3 md:py-4
        min-h-[calc(100vh-4.25rem)] min-h-[calc(100dvh-4.25rem)] box-border"
      data-pagina="bienvenida"
    >
      <section className="grid flex-1 grid-cols-1 md:grid-cols-2 items-center gap-6 md:gap-8 lg:gap-12 xl:gap-16
        px-2 sm:px-4 md:px-6 lg:px-8 py-2 md:py-4 min-h-[clamp(340px,46vh,500px)]">
        <div className="flex flex-col justify-center">
          <p className="text-terra-primario text-xs sm:text-terra-xs font-extrabold tracking-[0.18em] uppercase mb-2 sm:mb-3">
            Muebles para cada espacio
          </p>
          <h1 className="font-terra font-extrabold text-[#121820] dark:text-white tracking-tight leading-[1.05]
            text-4xl sm:text-5xl lg:text-6xl xl:text-7xl m-0">
            Bienvenido a <span className="text-terra-primario">TERRA</span>
          </h1>
          <p className="text-stone-600 dark:text-stone-300 text-sm sm:text-base leading-relaxed max-w-xl mt-3 sm:mt-4">
            Tu hogar merece lo mejor. Encuentra los muebles ideales para cada espacio, con la calidad y el confort que estás buscando.
          </p>

          <div className="mt-6 sm:mt-8">
            <Link
              to="/catalogo"
              className="group inline-flex items-center gap-3.5 rounded-full bg-terra-primario px-5 py-3.5 sm:px-6 sm:py-3.5
                text-white shadow-[0_12px_24px_rgba(166,25,46,0.35)] transition-all duration-200
                hover:-translate-y-0.5 hover:bg-terra-primario-oscuro hover:shadow-[0_16px_30px_rgba(166,25,46,0.4)]
                w-full sm:w-auto sm:min-w-[20rem]"
            >
              <span className="flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-full bg-white/16">
                <ShoppingBag size={22} />
              </span>
              <div className="text-left">
                <b className="block text-sm sm:text-base font-bold">Comenzar compra</b>
                <small className="block text-xs text-rose-200 mt-0.5">Ver catálogo completo</small>
              </div>
              <ArrowRight size={20} className="ml-auto shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-terra-tarjeta shadow-[0_18px_40px_rgba(41,37,36,0.18)]
          min-h-[280px] sm:min-h-[320px] md:min-h-[360px] lg:min-h-[420px] xl:min-h-[450px] w-full">
          {fotosPoltronas.map((foto, i) => (
            <img
              key={foto.src}
              src={foto.src}
              alt={foto.alt}
              className={`absolute inset-0 size-full object-cover transition-opacity duration-700 ease-in-out
                ${i === indice ? 'opacity-100' : 'opacity-0'}`}
            />
          ))}

          <button
            type="button"
            className="absolute top-1/2 left-3 sm:left-4 -translate-y-1/2 z-10 flex size-10 sm:size-11
              items-center justify-center rounded-full bg-white/90 text-stone-900 shadow-sm transition
              hover:bg-white hover:scale-105 active:scale-95 cursor-pointer"
            onClick={anterior}
            aria-label="Foto anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            className="absolute top-1/2 right-3 sm:right-4 -translate-y-1/2 z-10 flex size-10 sm:size-11
              items-center justify-center rounded-full bg-white/90 text-stone-900 shadow-sm transition
              hover:bg-white hover:scale-105 active:scale-95 cursor-pointer"
            onClick={siguiente}
            aria-label="Foto siguiente"
          >
            <ChevronRight size={20} />
          </button>

          <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-10 flex gap-2">
            {fotosPoltronas.map((foto, i) => (
              <button
                key={foto.src}
                type="button"
                className={`h-2 rounded-full cursor-pointer transition-all duration-200 p-0 border-0
                  ${i === indice ? 'w-6 bg-white' : 'w-2 bg-white/55 hover:bg-white/80'}`}
                onClick={() => setIndice(i)}
                aria-label={`Ver ${foto.alt}`}
              />
            ))}
          </div>

          <aside className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-10 w-[calc(100%-1.5rem)] sm:w-auto
            sm:max-w-xs rounded-xl border border-white/80 bg-white/95 dark:bg-stone-900/95 dark:border-stone-700
            p-3 sm:p-3.5 shadow-[0_10px_24px_rgba(18,24,32,0.18)] backdrop-blur-sm">
            <span className="flex items-center gap-1.5 text-[0.7rem] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              <Sofa size={14} /> Poltronas
            </span>
            <b className="block mt-1 text-xs sm:text-sm font-bold text-stone-900 dark:text-white">
              Poltronas y Sofas Cama
            </b>
            <footer className="mt-1.5 flex justify-end">
              <Link
                to="/catalogo"
                className="inline-flex items-center gap-1 text-xs font-bold text-stone-600 hover:text-terra-primario
                  dark:text-stone-300 dark:hover:text-terra-oferta no-underline"
              >
                Probar aquí <ArrowRight size={13} />
              </Link>
            </footer>
          </aside>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 rounded-2xl border border-stone-200 dark:border-terra-borde-suave
        bg-white dark:bg-terra-superficie shadow-[0_8px_20px_rgba(41,37,36,0.06)] mt-3 sm:mt-4 md:mt-5
        mx-2 sm:mx-4 md:mx-8 lg:mx-12">
        {garantias.map(({ icono: Icono, texto }, idx) => (
          <article
            key={texto}
            className={`flex items-center justify-center gap-3 p-3 sm:p-3.5 text-center sm:text-left
              ${idx > 0 ? 'border-t sm:border-t-0 sm:border-l border-stone-200 dark:border-terra-borde-suave' : ''}`}
          >
            <Icono size={24} className="shrink-0 text-terra-primario" />
            <p className="m-0 text-xs sm:text-sm font-semibold text-stone-700 dark:text-stone-200">
              {texto}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}