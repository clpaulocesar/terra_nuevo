import { Link } from 'react-router-dom';
import { ArrowRight, BedDouble, CreditCard, Grid2X2, Package, QrCode, ShieldCheck, ShoppingBag, Stars, Touchpad } from 'lucide-react';
import './Bienvenida.css';

const beneficios = [
  { icono: BedDouble, titulo: 'Probá en tienda', texto: 'Sentí la firmeza y adaptabilidad de cada modelo en nuestro showroom de Equipetrol.', pie: 'Test de firmeza libre', detalle: Touchpad },
  { icono: ShieldCheck, titulo: 'Garantía oficial de 10 años', texto: 'Respaldo TERRA certificado, con control de calidad y soporte para tu descanso.', pie: 'Calidad certificada', detalle: ShieldCheck },
  { icono: CreditCard, titulo: 'Pago ágil en caja', texto: 'Armá tu orden en pantalla y pagá al instante con efectivo, QR Simple o tarjeta.', pie: 'Ticket instantáneo', detalle: QrCode },
];

export default function Bienvenida() {
  return <div className="welcome-retail">
    <section className="welcome-hero">
      <div className="welcome-copy"><div><h1>Bienvenido a <span>TERRA</span></h1><h2>Encontrá la tecnología y el confort ideal para tu descanso.</h2><p>Explorá colchones con resortes Pocket, sommiers tapizados y accesorios ergonómicos. Compará medidas y emití tu orden en segundos.</p></div><div className="welcome-actions"><Link to="/catalogo" className="welcome-buy"><span><ShoppingBag size={23}/></span><div><b>Comenzar compra</b><small>Ver catálogo completo</small></div><ArrowRight size={22}/></Link><Link to="/categorias" className="welcome-categories"><span><Grid2X2 size={23}/></span><div><b>Explorar por categorías</b><small>Colchones, sommiers y linos</small></div><Package size={20}/></Link></div></div>
      <div className="welcome-image"><img src="https://lh3.googleusercontent.com/aida-public/AB6AXuA1WN6KakDgUmyqtLKbtnRjy03Y4Cfe0-xerd3JNnxXUANa-VOjGIBYY5L70MyBGqNFWV4u1UgYOHnowSB5L8DtzwgwSIQBd5Gf2YIN05DBYrz932bBcz3O-nxM1M-e_5QXlhBVDAU6LB1g4krQyyfsPCzpnnhfg492r9jun-m68VE8YZiP1BeH5Tlf_le7I-gIF23BGctAMTd0kfjdLKsPydxp_kdc2UP9FDtBB-_VqKvoBnOP2XI8" alt="Dormitorio contemporáneo TERRA"/><aside><span><Stars size={14}/> Destacado</span><b>Colchón Pocket Supreme</b><p>Resortes ensacados + espuma HR</p><footer><small>Desde</small><strong>Bs 4.890</strong><Link to="/catalogo">Probar aquí <ArrowRight size={14}/></Link></footer></aside></div>
    </section>
    <section className="welcome-benefits">{beneficios.map(({ icono: Icono, detalle: Detalle, titulo, texto, pie }) => <article key={titulo}><span className="welcome-benefit-icon"><Icono size={28}/></span><h2>{titulo}</h2><p>{texto}</p><footer><b>{pie}</b><Detalle size={18}/></footer></article>)}</section>
  </div>;
}
