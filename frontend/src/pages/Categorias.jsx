import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BedDouble, ChevronRight, Grid2X2, Home, LampDesk, LayoutGrid, Percent, Cloud, Sofa } from 'lucide-react';
import { listarCategorias } from '../services/productoService.js';
import './Categorias.css';

const categoriasFallback = [
  { id: 'Colchones', titulo: 'Colchones de alta gama', descripcion: 'Líneas Pocket, ortopédica, Memory Foam y látex natural.', detalle: 'Individual a King Size · Modelos en stock', imagen: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlx5hoI5-LN4YDg6w85ySTi1iMa43e_SPQMKXfhfA65uwJNemzEKvPcRppBcidh9dQ2GxsxmI0hBOiCc6SZrN-kmmazf-gWnd3jOTsS2SwcBm46Sb0weaSn-Pu8EzQe5eL-0vjlWDvlqpM8iEslcRxUS-xXbhLOlUnhB1YB1Q0I990Xb8oG23DLF22PGO2VxtNeoU-h9nyLyn8Je0jatUBeSz5vCmef_lruKPhpf9EyrSsj34ld_qf', featured: true, icono: BedDouble },
  { id: 'Sommiers', titulo: 'Sommiers y bases', descripcion: 'Bases fijas, reforzadas y estructuras Bouclé de alta resistencia.', detalle: 'Showroom y bodega listos para entrega', imagen: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAo_HjupuvRXBwB5r6ieQw-KYTiVkPdXRdQAi-4xqwx8xYztxh21RdVYXaSnYmnDkmDhTa1yf_IefviT3nd1IlFOWgC2s3naTH8zY6ViNtAgprX_5R3eIfPzuYZObZR4E_Z1wfQHyKnUQRjh08joYzgcn44oAgH0ljiuVDQHYKPbDt8O1_tGOeXor1UPQtRHL8X2RmDkWx106J0bEHiqBubiT2YtnuS6Atk1fBrJqXElFKElClzErZG', icono: Home },
  { id: 'Espaldares', titulo: 'Espaldares y cabeceros', descripcion: 'Diseño moderno, tapizados y acabados artesanales para tu sommier.', detalle: 'Variedad de colores y medidas', imagen: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8xq8qCNX0QJ4G62g09DTetk5oaM9MmSBf2QlPomRdNmB2btvnYDXHWumZo-yGDycAQz3lOfs_qdQRYMCvrOdxC3CWTI1NrLHRfJWA5ljnWqrxBCE1dVwXVzyng-IRISef_NAn3_LJrek92icvrcNBkbtwlmpxEZBga7Jm2wMs6yENe71CXA8W4Dr86CwR3ot96PCUcmhGNoHuWGYpehIXgPKbuIPgVRVAE1JNkGvUOU-Ws8iYFRjO', icono: BedDouble },
  { id: 'Muebles', titulo: 'Muebles y livings', descripcion: 'Configuraciones modulares de roble, lino y acabados premium.', detalle: 'Modelos de exhibición exclusiva', imagen: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB1Vwe7t4_vyguM_DFHmHPFwUwxXR00p7ChBRy5CNCyJORH7pgRgjVKEtSW6Gk4Tv5Do8nDHl4zZS3P6xJFA_xgZj7jwseXzskdc7mpg21jfKEcV4To3OOdUDgktakYnRT_nqR8G6lALJxux98c6mCRB3X0effgSw7LJgsPRXSoUsi3MNStqnsH3HWVi-Vi_ltoAMEjKO1-Bwn9Epa8R3GnFLow0E43QlvhTdIEr-ckdFBkx3QwKBxD', icono: Sofa },
  { id: 'Almohadas', titulo: 'Almohadas y descanso', descripcion: 'Espuma viscoelástica, gel refrescante e hipoalergénicas.', detalle: 'Confort cervical garantizado', imagen: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBhuDavR88vMqhW6l62U7Q7n6da7js0xXHoqWTBn_qpEqyigawoYeBULd_vSW9eH6qlqpwyZI8MD-zbGW1EVEEdVR09fbgsBxlfYFNQf_UmxJOcSUfw4-GIg0k5evAXCkB6iKM0asS-C5OtbXizyyTLgW_5BizSEgt74IljR_3AwN7Hyp8JUgSYAkF1A6EDYftbLO3u99dWipL8hBZd-ubBYDoUORvrahwRx29JOT-fK1vgvxm12qyY', icono: Cloud },
  { id: 'Ropa de cama', titulo: 'Ropa de cama y satén', descripcion: 'Sábanas de algodón egipcio de 400 hilos y fundas nórdicas.', detalle: 'Texturas suaves para el descanso', imagen: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAdBwWrc8PpIVnJDEXW_VjmE7FrBMY3RaeyHNlRNkOQnDGDwi8p7d3ZISDLnCPauCp_oY5uO_tGuJLBDdHQVrIqNLxjKYaJm_GmnKG2BvDPawm4L8wPQZL7R_4vIyZbMl-7QgaPFrp6aNsbx5M32JW1JHlriVehup7GGR-AcrHPfEKUaM3NSc6ogbciD39-kRYmYpbk-2D2CMRAgFpkACSxO0-89MWNPyfrZc0D0SA4y4MtRWCkFbN9', icono: LampDesk },
];

export default function Categorias() {
  const [listaCategorias, setListaCategorias] = useState([]);

  useEffect(() => {
    let cancelado = false;
    listarCategorias()
      .then((data) => {
        if (!cancelado && Array.isArray(data) && data.length > 0) {
          setListaCategorias(data);
        }
      })
      .catch(() => {});
    return () => { cancelado = true; };
  }, []);

  return (
    <div className="categorias-page">
      <header className="categorias-intro">
        <div>
          <span className="categorias-tag">
            <LayoutGrid size={15} /> Catálogo dinámico 2026
          </span>
          <h1>Explorá nuestras categorías de descanso y hogar</h1>
          <p>Seleccioná la línea que deseás descubrir. Tocá una tarjeta para ver modelos disponibles y precios en bolivianos.</p>
        </div>
        <div className="categorias-pills">
          <Link to="/catalogo">
            <Grid2X2 size={18} /> Todas
          </Link>
          {listaCategorias.length > 0 ? (
            listaCategorias.slice(0, 6).map((c) => (
              <Link key={c.id} to={`/catalogo?categoria=${encodeURIComponent(c.nombre)}`}>
                <span className="material-symbols-outlined text-[18px] mr-1">{c.icon || 'category'}</span>
                {c.nombre}
              </Link>
            ))
          ) : (
            <>
              <Link to="/catalogo?categoria=Colchones"><BedDouble size={18} /> Colchones</Link>
              <Link to="/catalogo?categoria=Sommiers"><Home size={18} /> Sommiers</Link>
              <Link to="/catalogo?categoria=Muebles"><Sofa size={18} /> Muebles</Link>
            </>
          )}
        </div>
      </header>

      <section className="categorias-grid">
        {categoriasFallback.map(({ id, titulo, descripcion, detalle, imagen, featured, icono: Icono }) => (
          <article className={`categoria-card ${featured ? 'categoria-featured' : ''}`} key={titulo}>
            <div className="categoria-image">
              <img src={imagen} alt={titulo} />
              <div className="categoria-image-shade" />
              {featured && <span className="categoria-badge">Prioridad showroom</span>}
              <h2><Icono size={22} /> {titulo}</h2>
            </div>
            <div className="categoria-body">
              <p>{descripcion}</p>
              <strong>{detalle}</strong>
              <Link to={`/catalogo?categoria=${encodeURIComponent(id)}`}>
                Ver {titulo} <ChevronRight size={20} />
              </Link>
            </div>
          </article>
        ))}
      </section>

      <section className="categorias-offer">
        <div className="categorias-offer-icon">
          <Percent size={29} />
        </div>
        <div>
          <span>Edición especial Santa Cruz</span>
          <h2>Promociones y oportunidades</h2>
          <p>Conjuntos seleccionados y combos familiares a precios preferenciales de tienda.</p>
        </div>
        <Link to="/catalogo?categoria=Promociones">
          Ver ofertas <ArrowRight size={19} />
        </Link>
      </section>

      <section className="categorias-all">
        <div>
          <h2>¿Preferís ver todos los modelos sin filtros?</h2>
          <p>Navegá los artículos disponibles para entrega inmediata en Santa Cruz.</p>
        </div>
        <Link to="/catalogo">
          <Grid2X2 size={20} /> Volver al catálogo completo
        </Link>
      </section>
    </div>
  );
}
