import { StrictMode, useEffect, useState } from 'react';
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
import { listarProductosDestacados } from './services/api.js';
import { crearPedidoBackend } from './services/pedidoService.js';
import './InicioCliente.css';

const INITIAL_CART = [
  {
    id: 101,
    nombre: 'CONFORT LYA',
    categoria: 'Almohada Ortopédica',
    precio: 20,
    cantidad: 2,
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDFo6yF-48xTz08p_L-rF4Z0ZsmE2u3fLhMkm_1jI6jQ45p3qQ1Z_m6G2eY0p-pA94_v2vM4N81s-Tqf4B2iQ4Rj5fL7yV2ZkFhYgW9bU3pT_7mP9kH_jV1B8r-4Z8K-tT4G7A4W2B1X0mY8v9C3pQ7',
  },
  {
    id: 102,
    nombre: 'SOFÁ CAMA NUVOLA',
    categoria: 'Stock en Sucursal Central',
    precio: 3280,
    cantidad: 1,
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBfy9dMfPB9IiWLd0EqA_bYO41kjvJw7QtX_g5Aq0d0hExCO5h2UydNobv-6d-QYDFy6qs0biXaKi-v3Z0aQxUEp6UxEdkgRwarTF1nEXZtwlaM8IOaozTbjDG9tfP3OInOB1LTaw9NuY5fEwrdNW7rTjB9HlO9R55AnAK5V84zdXsCaP-HgWhdHhVswR5T1uCi357PEzs_JeHnNtAWlN36TOuphQJmR9eakxCKxOIG',
  },
];

export default function AppGlobal() {
  const [sucursalActiva, setSucursalActiva] = useState(SUCURSALES_DATA[0]);
  const [paginaActual, setPaginaActual] = useState('inicio');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [productosDestacados, setProductosDestacados] = useState([]);

  // Cart & Drawers
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState(INITIAL_CART.slice(0, 0));
  const [cuponTexto, setCuponTexto] = useState('');
  const [cuponAplicado, setCuponAplicado] = useState(false);

  // Modals & Toast
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [toast, setToast] = useState({ visible: false, titulo: '', mensaje: '' });

  // Modo Noche / Modo Día
  const [modoOscuro, setModoOscuro] = useState(() => {
    try {
      return localStorage.getItem('terra_theme') === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (modoOscuro) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('terra_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('terra_theme', 'light');
      }
    } catch {
      // ignore
    }
  }, [modoOscuro]);

  const toggleModoOscuro = () => {
    setModoOscuro((prev) => {
      const nuevo = !prev;
      mostrarToast(
        nuevo ? 'Modo Noche activado' : 'Modo Día activado',
        nuevo
          ? 'Interfaz adaptada para ambientes oscuros y menor fatiga visual.'
          : 'Mostrando la interfaz normal de la tienda web.'
      );
      return nuevo;
    });
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
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const controlador = new AbortController();

    listarProductosDestacados(controlador.signal)
      .then(setProductosDestacados)
      .catch(() => {});

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
    setPaginaActual('catalogo');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cart calculations
  const totalArticulos = cartItems.reduce((acc, it) => acc + it.cantidad, 0);
  const subtotalProductos = cartItems.reduce((acc, it) => acc + it.precio * it.cantidad, 0);
  const descuentoAutoservicio = subtotalProductos > 100 || cuponAplicado ? 120 : 0;
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
    alert('Modo Kiosco de Accesibilidad Activado: Tamaño táctil ampliado y contraste regulado.');
  };

  const cambiarSucursal = (nuevaSucursal) => {
    if (!nuevaSucursal) return;
    setSucursalActiva(nuevaSucursal);
    mostrarToast(
      `Showroom: ${nuevaSucursal.nombre}`,
      `Catálogo y stock actualizados para retiro en ${nuevaSucursal.direccionCorta || nuevaSucursal.nombreCompleto}.`
    );
  };

  const respuestaAsistente = (texto) => {
    alert(`Asistente Terra: ${texto}. Te transferimos con el equipo de la sucursal activa (${sucursalActiva.nombre}).`);
    setAssistantOpen(false);
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

  return (
    <div className="min-h-screen bg-surface font-body-md text-body-md text-on-surface">
      {/* ========================================================= */}
      {/* ENCABEZADO UNIFICADO                                      */}
      {/* ========================================================= */}
      <Header
        sucursalActiva={sucursalActiva}
        setSucursalActiva={cambiarSucursal}
        onCambiarSucursalClick={irASucursales}
        paginaActual={paginaActual}
        onNavegar={navegarA}
        totalArticulos={totalArticulos}
        onAbrirCarrito={() => setCartOpen(true)}
        onToggleAccesibilidad={toggleAccesibilidad}
        modoOscuro={modoOscuro}
        onToggleModoOscuro={toggleModoOscuro}
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        onEjecutarBusqueda={ejecutarBusqueda}
        onAbrirMiCuenta={() => setAccountModalOpen(true)}
      />

      {/* ========================================================= */}
      {/* CONTENIDO PRINCIPAL SEGÚN PÁGINA                          */}
      {/* ========================================================= */}
      <main className="w-full pt-44 bg-surface" id="contenido-principal">
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
            setSucursalActiva={cambiarSucursal}
            onAgregarAlCarrito={agregarAlCarrito}
            categoriaInicial={categoriaSeleccionada}
            busquedaInicial={busqueda}
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

      <Modals
        sucursalActiva={sucursalActiva}
        assistantOpen={assistantOpen}
        onCloseAssistant={() => setAssistantOpen(false)}
        onRespuestaAsistente={respuestaAsistente}
        qrModalOpen={qrModalOpen}
        onCloseQrModal={() => setQrModalOpen(false)}
        accountModalOpen={accountModalOpen}
        onCloseAccountModal={() => setAccountModalOpen(false)}
        onLoginSuccess={(usuario) => {
          mostrarToast('Sesión Iniciada con Éxito', `Bienvenido(a), ${usuario.nombre}. Tu cuenta minorista está activa.`);
        }}
      />

      {/* Interactive Toast Notification */}
      <div
        className={`fixed top-48 right-6 z-50 transform transition-all duration-300 pointer-events-none bg-inverse-surface text-inverse-on-surface px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 ${
          toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-[-100px] opacity-0'
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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppGlobal />
  </StrictMode>
);
