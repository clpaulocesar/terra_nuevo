import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import FloatingActions from './components/FloatingActions.jsx';
import Modals from './components/Modals.jsx';
import InicioPage from './pages/InicioPage.jsx';
import CatalogoPage from './pages/CatalogoPage.jsx';
import DetalleProductoPage from './pages/DetalleProductoPage.jsx';
import CarritoPage from './pages/CarritoPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import { SUCURSALES_DATA } from './data/sucursalesData.js';
import { CATEGORY_PILLS } from './data/catalogoData.js';
import { listarProductosDestacados, obtenerCategorias } from './services/api.js';
import { crearPedidoBackend } from './services/pedidoService.js';
import { registrarVistaPublica } from './services/analyticsService.js';
import { VozProvider, useVoz } from './context/VozContext.jsx';
import TutorialVozModal from './components/TutorialVozModal.jsx';
import { TemporadaProvider, useTemporada } from './context/TemporadaContext.jsx';
import TemporadaAmbiental from './components/TemporadaAmbiental.jsx';
import ChatAsistente from './components/chat/ChatAsistente.jsx';
import './index.css';

function AppGlobalContent() {
  const {
    anunciar,
    registrarAcciones,
    modalTutorialAbierto,
    setModalTutorialAbierto,
    procesarTextoVoz,
  } = useVoz();

  const [sucursalActiva, setSucursalActiva] = useState(SUCURSALES_DATA[0]);
  const [paginaActual, setPaginaActual] = useState('inicio');
  const ultimaPaginaRegistrada = useRef(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [busquedaAplicada, setBusquedaAplicada] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [productosDestacados, setProductosDestacados] = useState([]);
  const [categoriasNavegacion, setCategoriasNavegacion] = useState(
    CATEGORY_PILLS.filter((categoria) => categoria.id !== 'todas' && !categoria.isOffer)
  );
  const { temporada, festivoActual, alternarDiaNoche, esModoDia } = useTemporada();

  useEffect(() => {
    if (ultimaPaginaRegistrada.current === paginaActual) return;
    ultimaPaginaRegistrada.current = paginaActual;

    const rutas = {
      inicio: '/',
      catalogo: '/catalogo',
      detalle: '/productos',
      carrito: '/carrito',
      checkout: '/checkout',
    };

    registrarVistaPublica(rutas[paginaActual] || '/')
      .catch((error) => console.error('No se pudo registrar la visita pública:', error));
  }, [paginaActual]);

  // Cart & Drawers
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [cuponTexto, setCuponTexto] = useState('');
  const [cuponAplicado, setCuponAplicado] = useState(false);

  // Modals & Toast
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [toast, setToast] = useState({ visible: false, titulo: '', mensaje: '' });

  // Modo Noche / Modo Día sincronizado con temporada
  const toggleModoDiaNoche = () => {
    alternarDiaNoche();
    if (esModoDia) {
      const nombreFestivo = festivoActual === 'halloween' ? 'Halloween' : festivoActual === 'navidad' ? 'Navidad' : 'Noche';
      mostrarToast(`Modo Noche (${nombreFestivo}) activado`, 'Ambiente temático y festivo activado en la tienda.');
    } else {
      mostrarToast('Modo Día activado', 'Mostrando el diseño estándar y luminoso de TERRA.');
    }
  };

  // Escape to close
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setCartOpen(false);
        setAssistantOpen(false);
        setQrModalOpen(false);
        setAccountModalOpen(false);
      }
    };
    const abrirChat = () => setAssistantOpen(true);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('terra:abrir-chat', abrirChat);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('terra:abrir-chat', abrirChat);
    };
  }, []);

  useEffect(() => {
    const controlador = new AbortController();

    listarProductosDestacados(controlador.signal)
      .then((prods) => {
        if (Array.isArray(prods) && prods.length > 0) {
          setProductosDestacados(prods);
        } else {
          listarProductos({ limite: 24, signal: controlador.signal })
            .then((res) => {
              if (Array.isArray(res?.productos) && res.productos.length > 0) {
                setProductosDestacados(res.productos);
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        listarProductos({ limite: 24, signal: controlador.signal })
          .then((res) => {
            if (Array.isArray(res?.productos) && res.productos.length > 0) {
              setProductosDestacados(res.productos);
            }
          })
          .catch(() => {});
      });

    obtenerCategorias(controlador.signal)
      .then((categorias) => {
        if (Array.isArray(categorias) && categorias.length > 0) {
          setCategoriasNavegacion(
            categorias
              .map((categoria) => ({
                id: categoria.key || categoria.id,
                label: categoria.nombre,
                icon: categoria.icono || 'category',
                total: categoria.total || 0,
              }))
              .filter((categoria) => categoria.id && categoria.id !== 'todas' && categoria.id !== 'ofertas')
          );
        }
      })
      .catch(() => { });

    return () => controlador.abort();
  }, []);

  // Show Toast
  const mostrarToast = (titulo, mensaje) => {
    setToast({ visible: true, titulo, mensaje });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2800);
  };

  // Navigation
  const navegarA = (pagina, categoria = 'todas', prod = null) => {
    setPaginaActual(pagina);
    setCategoriaSeleccionada(categoria);
    if (prod) {
      setProductoSeleccionado(prod);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const ejecutarBusqueda = (query) => {
    setBusqueda(query);
    setBusquedaAplicada(query.trim());
    setPaginaActual('catalogo');
    anunciar(`Buscando ${query} en el catálogo`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cart calculations
  const totalArticulos = cartItems.reduce((acc, it) => acc + it.cantidad, 0);
  const subtotalProductos = cartItems.reduce((acc, it) => acc + it.precio * it.cantidad, 0);
  const descuentoAutoservicio = cuponAplicado ? 120 : 0;
  const totalPagar = Math.max(0, subtotalProductos - descuentoAutoservicio);

  const cambiarCantidad = (id, delta) => {
    setCartItems((prev) =>
      prev
        .map((it) => (it.id === id ? { ...it, cantidad: it.cantidad + delta } : it))
        .filter((it) => it.cantidad > 0)
    );
  };

  const eliminarItem = (id) => {
    setCartItems((prev) => prev.filter((it) => it.id !== id));
  };

  const vaciarCarrito = () => {
    if (window.confirm('¿Deseas vaciar todos los productos del carrito?')) {
      setCartItems([]);
    }
  };

  const agregarAlCarrito = (producto) => {
    const titulo = producto.nombre || producto.titulo;
    anunciar(`Agregado al carrito: ${titulo}`);
    setCartItems((prev) => {
      const existe = prev.find((it) => it.nombre.toLowerCase() === titulo.toLowerCase());
      if (existe) {
        return prev.map((it) =>
          it.id === existe.id ? { ...it, cantidad: it.cantidad + 1 } : it
        );
      }
      return [
        ...prev,
        {
          id: Date.now(),
          nombre: titulo,
          categoria: `Stock en ${sucursalActiva.nombre}`,
          precio: producto.precio,
          cantidad: 1,
          src: producto.imagen || producto.src,
        },
      ];
    });

    mostrarToast(
      'Producto agregado al carrito',
      `Disponible para retiro en Showroom ${sucursalActiva.nombreCompleto}`
    );
  };

  const aplicarCupon = (e) => {
    e.preventDefault();
    if (cuponTexto.trim()) {
      setCuponAplicado(true);
      alert(`¡Código "${cuponTexto.trim().toUpperCase()}" aplicado con éxito! Descuento promocional activo.`);
    } else {
      alert('Por favor introduce un código válido.');
    }
  };

  const procederPago = () => {
    setCartOpen(false);
    navegarA('checkout');
  };

  const toggleAccesibilidad = () => {
    setModalTutorialAbierto(true);
  };

  const cambiarSucursal = (nuevaSucursal) => {
    if (!nuevaSucursal) return;
    setSucursalActiva(nuevaSucursal);
    mostrarToast(
      `Showroom: ${nuevaSucursal.nombre}`,
      `Catálogo y stock actualizados para retiro en ${nuevaSucursal.direccionCorta || nuevaSucursal.nombreCompleto}.`
    );
  };

  const irASucursales = () => {
    if (paginaActual !== 'inicio') {
      setPaginaActual('inicio');
      setTimeout(() => {
        document.getElementById('sucursales-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById('sucursales-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    registrarAcciones({
      onNavegar: navegarA,
      onEjecutarBusqueda: ejecutarBusqueda,
      onAbrirCarrito: () => setCartOpen(true),
      onCerrarCarrito: () => setCartOpen(false),
      onAbrirMiCuenta: () => setAccountModalOpen(true),
      onAbrirSucursales: irASucursales,
      onModoOscuro: () => toggleModoDiaNoche(),
    });
  }, [navegarA, ejecutarBusqueda, irASucursales, registrarAcciones, toggleModoDiaNoche]);

  return (
    <div className="min-h-screen bg-surface font-body-md text-body-md text-on-surface">
      <TemporadaAmbiental />
      {/* ========================================================= */}
      {/* ENCABEZADO UNIFICADO                                      */}
      {/* ========================================================= */}
      <Header
        sucursalActiva={sucursalActiva}
        setSucursalActiva={cambiarSucursal}
        onCambiarSucursalClick={irASucursales}
        paginaActual={paginaActual}
        categoriaActiva={categoriaSeleccionada}
        categorias={categoriasNavegacion}
        onNavegar={navegarA}
        totalArticulos={totalArticulos}
        onAbrirCarrito={() => setCartOpen(true)}
        onToggleAccesibilidad={toggleAccesibilidad}
        modoOscuro={!esModoDia}
        temporada={temporada}
        festivoActual={festivoActual}
        onToggleModoOscuro={toggleModoDiaNoche}
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        onEjecutarBusqueda={ejecutarBusqueda}
        onAbrirMiCuenta={() => setAccountModalOpen(true)}
      />

      {/* ========================================================= */}
      {/* CONTENIDO PRINCIPAL SEGÚN PÁGINA                          */}
      {/* ========================================================= */}
      <main className="w-full pt-36 sm:pt-44 bg-surface" id="contenido-principal">
        {paginaActual === 'inicio' && (
          <InicioPage
            sucursalActiva={sucursalActiva}
            setSucursalActiva={cambiarSucursal}
            onNavegar={navegarA}
            onAgregarAlCarrito={agregarAlCarrito}
            onVerDetalle={(prod) => navegarA('detalle', 'todas', prod)}
            productosDestacados={productosDestacados}
          />
        )}
        {paginaActual === 'catalogo' && (
          <CatalogoPage
            sucursalActiva={sucursalActiva}
            onAgregarAlCarrito={agregarAlCarrito}
            categoriaInicial={categoriaSeleccionada}
            onCambiarCategoria={setCategoriaSeleccionada}
            busquedaInicial={busquedaAplicada}
            onLimpiarBusqueda={() => {
              setBusqueda('');
              setBusquedaAplicada('');
            }}
            onVerDetalle={(prod) => navegarA('detalle', 'todas', prod)}
          />
        )}
        {paginaActual === 'detalle' && (
          <DetalleProductoPage
            producto={productoSeleccionado || undefined}
            sucursalActiva={sucursalActiva}
            setSucursalActiva={cambiarSucursal}
            onNavegar={navegarA}
            onAgregarAlCarrito={agregarAlCarrito}
            onAbrirSucursales={irASucursales}
            onVerDetalle={(prod) => navegarA('detalle', 'todas', prod)}
          />
        )}
        {paginaActual === 'carrito' && (
          <CarritoPage
            cartItems={cartItems}
            sucursalActiva={sucursalActiva}
            onNavegar={navegarA}
            cambiarCantidad={cambiarCantidad}
            eliminarItem={eliminarItem}
            vaciarCarrito={vaciarCarrito}
            onAgregarAlCarrito={agregarAlCarrito}
            onProcederPago={procederPago}
            onVerDetalle={(prod) => navegarA('detalle', 'todas', prod)}
          />
        )}
        {paginaActual === 'checkout' && (
          <CheckoutPage
            cartItems={cartItems}
            sucursalActiva={sucursalActiva}
            onNavegar={navegarA}
            onFinalizarCompra={async (datos) => {
              const res = await crearPedidoBackend({
                cartItems,
                metodoPago: datos.metodoPago,
                modalidadEntrega: datos.modalidadEntrega,
                sucursal: datos.sucursal,
                cliente: datos.cliente,
              });
              const codigo = res.pedido?.id || res.pedido?.codigo || 'TERRA-SCZ-84920';
              alert(
                `¡Compra registrada con éxito por Bs ${Number(datos.totalPagar || 0).toLocaleString('es-BO', {
                  minimumFractionDigits: 2,
                })}! Método: ${datos.metodoPago.toUpperCase()} · Pedido #${codigo}`
              );
              setCartItems([]);
              navegarA('inicio');
            }}
          />
        )}
      </main>

      {/* ========================================================= */}
      {/* FOOTER UNIFICADO                                          */}
      {/* ========================================================= */}
      <Footer onNavegarASucursales={irASucursales} />

      {/* ========================================================= */}
      {/* ACCIONES FLOTANTES & MODALES                              */}
      {/* ========================================================= */}
      <FloatingActions
        totalArticulos={totalArticulos}
        onAbrirQr={() => setQrModalOpen(true)}
        onAbrirCarrito={() => setCartOpen(true)}
        onToggleAsistente={() => setAssistantOpen((o) => !o)}
        onToggleAccesibilidad={toggleAccesibilidad}
      />

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        sucursalActiva={sucursalActiva}
        cartItems={cartItems}
        totalArticulos={totalArticulos}
        subtotalProductos={subtotalProductos}
        descuentoAutoservicio={descuentoAutoservicio}
        totalPagar={totalPagar}
        cambiarCantidad={cambiarCantidad}
        eliminarItem={eliminarItem}
        vaciarCarrito={vaciarCarrito}
        procederPago={procederPago}
        cuponTexto={cuponTexto}
        setCuponTexto={setCuponTexto}
        aplicarCupon={aplicarCupon}
        onCambiarSucursalClick={irASucursales}
        onVerCarritoCompleto={() => navegarA('carrito')}
      />

      <ChatAsistente
        abierto={assistantOpen}
        onCerrar={() => setAssistantOpen(false)}
        onNavegar={navegarA}
      />

      <Modals
        sucursalActiva={sucursalActiva}
        qrModalOpen={qrModalOpen}
        onCloseQrModal={() => setQrModalOpen(false)}
        accountModalOpen={accountModalOpen}
        onCloseAccountModal={() => setAccountModalOpen(false)}
        onLoginSuccess={(usuario) => {
          mostrarToast('Sesión Iniciada con Éxito', `Bienvenido(a), ${usuario.nombre}. Tu cuenta minorista está activa.`);
        }}
      />

      <TutorialVozModal
        abierto={modalTutorialAbierto}
        onCerrar={() => setModalTutorialAbierto(false)}
        onEjecutarComando={procesarTextoVoz}
      />

      {/* Interactive Toast Notification */}
      <div
        className={`fixed top-48 right-6 z-50 transform transition-all duration-300 pointer-events-none bg-inverse-surface text-inverse-on-surface px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 ${toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-[-100px] opacity-0'
          }`}
        id="catalog-toast"
      >
        <span className="material-symbols-outlined text-tertiary-fixed text-[24px]">check_circle</span>
        <div>
          <p className="font-label-interactive text-label-interactive font-bold">{toast.titulo}</p>
          <p className="font-body-sm text-body-sm text-surface-container-highest text-[12px]">{toast.mensaje}</p>
        </div>
      </div>
    </div>
  );
}

export default function AppGlobal() {
  return (
    <VozProvider>
      <TemporadaProvider>
        <AppGlobalContent />
      </TemporadaProvider>
    </VozProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppGlobal />
  </StrictMode>
);
