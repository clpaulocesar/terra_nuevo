import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, CreditCard, ShieldCheck, ShoppingBag, Sofa, Truck } from 'lucide-react';
import './Bienvenida.css';
import './BienvenidaFeaturedHidden.css';

const garantias = [
  { icono: Truck, texto: 'Pedido en Línea' },
  { icono: ShieldCheck, texto: 'Garantía oficial de Terra' },
  { icono: CreditCard, texto: 'Pago seguro en caja' },
];

const fotosPoltronas = [
  { src: '/images/inicio/poltrona1.jpeg', alt: 'Poltrona TERRA modelo 1' },
  { src: '/images/inicio/poltrona2.jpeg', alt: 'Poltrona TERRA modelo 2' },
  { src: '/images/inicio/poltrona3.jpeg', alt: 'Poltrona TERRA modelo 3' },
  { src: '/images/inicio/sofacama1.jpeg', alt: 'Sofá cama TERRA modelo 1' },
  { src: '/images/inicio/sofacama2.jpeg', alt: 'Sofá cama TERRA modelo 2' },
  { src: '/images/inicio/sofacama3.jpeg', alt: 'Sofá cama TERRA modelo 3' },
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
    <div className="welcome-retail">
      <section className="welcome-hero">
        <div className="welcome-copy">
          <p className="welcome-eyebrow">Muebles para cada espacio</p>
          <h1>
            Bienvenido a <span>TERRA</span>
          </h1>
          <p>
            Tu hogar merece lo mejor. Encuentra los muebles ideales para cada espacio, con la calidad y el confort que estás buscando.
          </p>

          <div className="welcome-actions">
            <Link to="/catalogo" className="welcome-cta">
              <span>
                <ShoppingBag size={23} />
              </span>
              <div>
                <b>Comenzar compra</b>
                <small>Ver catálogo completo</small>
              </div>
              <ArrowRight size={22} />
            </Link>
          </div>
        </div>

        <div className="welcome-photo">
          {fotosPoltronas.map((foto, i) => (
            <img
              key={foto.src}
              src={foto.src}
              alt={foto.alt}
              className={i === indice ? 'activa' : ''}
            />
          ))}
          <button className="carousel-btn anterior" type="button" onClick={anterior} aria-label="Foto anterior">
            <ChevronLeft size={22} />
          </button>
          <button className="carousel-btn siguiente" type="button" onClick={siguiente} aria-label="Foto siguiente">
            <ChevronRight size={22} />
          </button>
          <div className="carousel-dots">
            {fotosPoltronas.map((foto, i) => (
              <button
                key={foto.src}
                type="button"
                className={i === indice ? 'activo' : ''}
                onClick={() => setIndice(i)}
                aria-label={`Ver ${foto.alt}`}
              />
            ))}
          </div>
          <aside className="welcome-spot">
            <span>
              <Sofa size={14} /> Poltronas
            </span>
            <b>Poltronas y Sofas Cama</b>
            <footer>
              <Link to="/catalogo">
                Probar aquí <ArrowRight size={14} />
              </Link>
            </footer>
          </aside>
        </div>
      </section>

      <section className="welcome-trust">
        {garantias.map(({ icono: Icono, texto }) => (
          <article key={texto}>
            <Icono size={26} />
            <p>{texto}</p>
          </article>
        ))}
      </section>
    </div>
  );
}