import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BedDouble, CreditCard, QrCode, ShieldCheck, ShoppingBag, Stars, Touchpad } from 'lucide-react';
import { listarProductos } from '../services/productoService.js';
import { formatoMoneda } from '../utils/formatoMoneda.js';
import './Bienvenida.css';
import './BienvenidaFeaturedHidden.css';

const beneficios = [
  { icono: BedDouble, titulo: 'Probá en tienda', texto: 'Sentí la firmeza y adaptabilidad de cada modelo en nuestro showroom de Equipetrol.', pie: 'Test de firmeza libre', detalle: Touchpad },
  { icono: ShieldCheck, titulo: 'Garantía oficial de 10 años', texto: 'Respaldo TERRA certificado, con control de calidad y soporte para tu descanso.', pie: 'Calidad certificada', detalle: ShieldCheck },
  { icono: CreditCard, titulo: 'Pago ágil en caja', texto: 'Armá tu orden en pantalla y pagá al instante con efectivo, QR Simple o tarjeta.', pie: 'Ticket instantáneo', detalle: QrCode },
];

const IMAGEN_PORTADA = 'https://res.cloudinary.com/dctrmbmh4/image/upload/v1792006789/WhatsApp_Image_2026-10-14_at_3.39.17_PM_avpzz5.jpg';

export default function Bienvenida() {
  const [poltronas, setPoltronas] = useState([]);
  const [indiceActivo, setIndiceActivo] = useState(0);

  // Carga los productos de la categoría "Poltronas" desde la base de datos
  useEffect(() => {
    let activo = true;
    listarProductos({ categoria: 'Poltronas', limite: 12 })
      .then((lista) => { if (activo) setPoltronas((Array.isArray(lista) ? lista : []).filter((p) => p.imagen_url)); })
      .catch(() => { if (activo) setPoltronas([]); });
    return () => { activo = false; };
  }, []);

  // Cambio automático de slide cada 4 segundos
  useEffect(() => {
    if (poltronas.length < 2) return undefined;
    const temporizador = setInterval(() => setIndiceActivo((i) => (i + 1) % poltronas.length), 4000);
    return () => clearInterval(temporizador);
  }, [poltronas.length]);

  return <div className="welcome-retail">
    <section className="welcome-hero">
      <div className="welcome-copy"><div><h1>Bienvenido a <span>TERRA</span></h1><h2>Encontrá la tecnología y el confort ideal para tu descanso.</h2><p>Explorá colchones con resortes Pocket, sommiers tapizados y accesorios ergonómicos. Compará medidas y emití tu orden en segundos.</p></div><div className="welcome-actions"><Link to="/catalogo" className="welcome-buy"><span><ShoppingBag size={23}/></span><div><b>Comenzar compra</b><small>Ver catálogo completo</small></div><ArrowRight size={22}/></Link></div></div>
      <div className={`welcome-image${poltronas.length ? ' welcome-image--carrusel' : ''}`}>
        {poltronas.length ? <>
          {poltronas.map((item, indice) => <Link key={item.id} to={`/productos/${item.id}`} className={`welcome-slide${indice === indiceActivo ? ' activo' : ''}`} aria-hidden={indice !== indiceActivo} tabIndex={indice === indiceActivo ? 0 : -1}>
            <img src={item.imagen_url} alt={item.nombre}/>
            <div className="welcome-slide-info"><span><Stars size={13}/> Poltronas</span><b>{item.nombre}</b><small>{formatoMoneda(item.precio)}</small><em>Ver producto <ArrowRight size={14}/></em></div>
          </Link>)}
          {poltronas.length > 1 && <div className="welcome-slide-dots">{poltronas.map((item, indice) => <button key={item.id} type="button" className={indice === indiceActivo ? 'activo' : ''} onClick={() => setIndiceActivo(indice)} aria-label={`Ver ${item.nombre}`}/>)}</div>}
        </> : <img src={IMAGEN_PORTADA} alt="Dormitorio contemporáneo TERRA"/>}
      </div>
    </section>
    <section className="welcome-benefits">{beneficios.map(({ icono: Icono, detalle: Detalle, titulo, texto, pie }) => <article key={titulo}><span className="welcome-benefit-icon"><Icono size={28}/></span><h2>{titulo}</h2><p>{texto}</p><footer><b>{pie}</b><Detalle size={18}/></footer></article>)}</section>
  </div>;
}
