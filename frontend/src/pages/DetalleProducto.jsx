import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight, Minus, PackageCheck, Plus, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import { obtenerProducto } from '../services/productoService.js';
import { useCarrito } from '../hooks/useCarrito.js';
import { formatoMoneda } from '../utils/formatoMoneda.js';
import { emojiCategoria } from '../data/categorias.js';
import './DetalleProducto.css';

const FOTOS = ['https://lh3.googleusercontent.com/aida-public/AB6AXuA_0IGZ5s0DjeFACULr5bK2zw8jNwY_4ygmGz_44Kd65Bb13xtjOAWf_fm_SD4sowQnCxMzCwU_ZD_DlXUGgV7nKlnEyI79XA31Ux46VzAsTssz8IaDziDvdlnriYJndVw-fukT_eKvBuoZjUQ7TIUvqEM4I4DJGnrYW6oGxCOdnHj9ITk2DfjrYEHNFCmMYaIS2C5r-2fvONkPGloLIafxeLD40KaqPvmWXpvg6uCzUefyXPRDfnq2','https://lh3.googleusercontent.com/aida-public/AB6AXuBEmshhPCR02R1rPB00S3yCTur7glZQk9xFegzv8g33Br4UBSp_b-NiIrb8dIMqy48zrs6SIER6ZtNnvKhWeaPYDRLyIORRhNZe-Uq5b6qOb41zrVtgxGtEYUyZwk1FSSnPDyIQoeq_-Hw4Qgvs7MfvzXMGjlDoml5sTc5YEfsRKOKXUmJrq0aPrYAoQNXWxKb3-06Lgp5IOLKPDCQhyYRY7nsRK_YDRu6kGkvyRbEfb2MJ_Dkn4rud','https://lh3.googleusercontent.com/aida-public/AB6AXuCbgAk-ekwWog04vbc4vd4qkhpiPPY_6hT5ZX5EOmqXOT6sZq-GCiChAvqFzUPGEk2VIRlE9m_BuqEtR9vgBcTEujuzJUi_k6UOwvdhv9LYRpLlHHiP-u2qSaiWk3FxevWrr7VYt1wKqJz-nqFL7K5VbX2aJ2_y1b_S8krM-UDBvb3ZzGKwC-y8ay8_EKcA8E_IZ_98y74Cs2Mn994Lx6Uf8mpjjl-qYcFYCxHDX27iQ_oNoPSQhLu2'];

export default function DetalleProducto(){
 const {id}=useParams(),{agregarProducto}=useCarrito(); const [producto,setProducto]=useState(null),[cargando,setCargando]=useState(true),[error,setError]=useState(''),[foto,setFoto]=useState(0),[cantidad,setCantidad]=useState(1),[agregado,setAgregado]=useState(false);
 useEffect(()=>{
   let activo=true;
   setCargando(true);
   obtenerProducto(id)
     .then(res=>{
       if(activo){
         if(res) setProducto(res);
         else setError('Producto no encontrado.');
       }
     })
     .catch((err)=>{ if(activo) setError(err.message || 'No fue posible cargar el producto.'); })
     .finally(()=>{if(activo) setCargando(false)});
   return ()=>{activo=false};
 },[id]);
 if(cargando)return <p className="detalle-status">Cargando producto…</p>; if(error||!producto)return <div className="detalle-status"><p>{error||'Producto no encontrado.'}</p><Link to="/catalogo">Volver al catálogo</Link></div>;
 const fotos=(producto.imagenes?.length ? producto.imagenes : (producto.imagen_url ? [producto.imagen_url] : FOTOS)); const agregar=()=>{if(agregarProducto(producto,cantidad)){setAgregado(true);setTimeout(()=>setAgregado(false),1800)}};
 return <section className="detalle-page"><Link className="detalle-back" to="/catalogo"><ArrowLeft size={21}/>Volver al catálogo</Link><div className="detalle-layout"><div><div className="detalle-gallery"><img src={fotos[foto]} alt={producto.nombre}/><span><ShieldCheck size={16}/> Calidad garantizada TERRA</span></div><div className="detalle-thumbs">{fotos.map((src,i)=><button className={foto===i?'active':''} onClick={()=>setFoto(i)} type="button" key={src}><img src={src} alt={`Vista ${i+1}`}/></button>)}</div><div className="detalle-delivery"><Truck size={25}/><div><b>Entrega y retiro coordinado</b><p>Consultá disponibilidad y condiciones directamente en caja.</p></div><PackageCheck size={21}/></div></div><div className="detalle-info"><span className="detalle-category">{emojiCategoria(producto.categoria)} {producto.categoria}</span><h1>{producto.nombre}</h1><p>{producto.descripcion||'Producto seleccionado de nuestra colección TERRA.'}</p><div className="detalle-price"><strong>{formatoMoneda(producto.precio)}</strong><span>Precio por unidad</span></div><div className="detalle-specs"><b>Características</b><div><span>✓ Producto de calidad TERRA</span><span>✓ Atención en tienda</span><span>✓ Compra segura en caja</span><span>✓ Stock actualizado</span></div><p className={producto.stock?'in-stock':'out-stock'}>{producto.stock?`Disponible: ${producto.stock} unidades`:'Producto agotado'}</p></div><div className="detalle-actions"><div className="detalle-quantity"><button disabled={cantidad<=1} onClick={()=>setCantidad(cantidad-1)} type="button"><Minus/></button><b>{cantidad}</b><button disabled={cantidad>=producto.stock} onClick={()=>setCantidad(cantidad+1)} type="button"><Plus/></button></div><button className="detalle-add" disabled={!producto.stock} onClick={agregar} type="button">{agregado?<><Check/>Agregado al carrito</>:<><ShoppingBag/>Agregar · {formatoMoneda(producto.precio*cantidad)}</>}</button></div><Link className="detalle-cart-link" to="/carrito">Ver mi carrito <ChevronRight size={18}/></Link></div></div></section>;
}
