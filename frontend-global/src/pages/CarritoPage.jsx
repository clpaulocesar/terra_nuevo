import { useState, useEffect } from 'react';
import { listarProductos } from '../services/api.js';

function formatBs(val) {
  return 'Bs ' + Number(val || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CarritoPage({
  cartItems = [],
  sucursalActiva,
  onNavegar,
  cambiarCantidad,
  eliminarItem,
  vaciarCarrito,
  onAgregarAlCarrito,
  onProcederPago,
  onVerDetalle,
}) {
  const [modalidadEntrega, setModalidadEntrega] = useState('pickup'); // 'pickup' | 'delivery'
  const [salaRetiroSeleccionada, setSalaRetiroSeleccionada] = useState(sucursalActiva?.id || 'central');
  const [addonProteccion, setAddonProteccion] = useState(false);
  const [cuponInput, setCuponInput] = useState('');
  const [cuponValido, setCuponValido] = useState(false);
  const [cuponMensaje, setCuponMensaje] = useState('');
  const [complementos, setComplementos] = useState([]);

  useEffect(() => {
    const controlador = new AbortController();
    listarProductos({
      signal: controlador.signal,
      limite: 4,
      orden: 'recomendados',
    })
      .then((res) => {
        if (Array.isArray(res?.productos) && res.productos.length > 0) {
          setComplementos(res.productos.slice(0, 4));
        }
      })
      .catch(() => {});
    return () => controlador.abort();
  }, []);

  // Totales
  const totalArticulos = cartItems.reduce((acc, it) => acc + it.cantidad, 0);
  const subtotalProductos = cartItems.reduce((acc, it) => acc + it.precio * it.cantidad, 0);
  const costoServicios = addonProteccion ? 120 : 0;
  const descuentoAutoservicio = cuponValido ? 120 : 0;
  const costoEnvio = 0; // Flete se liquida o coordina según zona de entrega
  const totalPagar = Math.max(0, subtotalProductos - descuentoAutoservicio + costoServicios + costoEnvio);


  const aplicarCupon = (e) => {
    e?.preventDefault();
    if (cuponInput.trim().toUpperCase() === 'TERRASCZ2025') {
      setCuponValido(true);
      setCuponMensaje('Código TERRASCZ2025 aplicado (-Bs 120,00)');
    } else if (cuponInput.trim()) {
      setCuponValido(false);
      setCuponMensaje('Código no válido para esta compra');
    }
  };

  return (
    <div className="flex flex-col w-full bg-surface">
      <div className="w-full px-margin py-space-xl">
        {/* ========================================================= */}
        {/* Breadcrumbs & Status Header                              */}
        {/* ========================================================= */}
        <section className="mb-space-xl">
          <div className="flex items-center gap-2 font-label-subtle text-label-subtle text-on-surface-variant mb-space-sm">
            <button
              type="button"
              className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
              onClick={() => onNavegar('inicio')}
            >
              <span className="material-symbols-outlined text-[16px]">home</span> Inicio
            </button>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <button
              type="button"
              className="hover:text-primary transition-colors cursor-pointer"
              onClick={() => onNavegar('catalogo')}
            >
              Catálogo Santa Cruz
            </button>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-on-surface font-semibold">Mi Carrito de Compras</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">
                  Tu Carrito de Compras
                </h1>
                <span
                  className="px-3 py-1 rounded-full bg-primary/10 text-primary font-label-interactive text-label-interactive text-[13px] font-semibold"
                  id="cart-pill-count"
                >
                  {totalArticulos} {totalArticulos === 1 ? 'artículo seleccionado' : 'artículos seleccionados'}
                </span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                Revisa tus productos, selecciona retiro inmediato en nuestras 3 salas o despacho a domicilio dentro de Gran Santa Cruz.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-surface-container px-3.5 py-1.5 rounded-full font-label-subtle text-label-subtle text-on-surface-variant">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
              Terminal en Línea: <span className="font-semibold text-on-surface">{sucursalActiva?.nombreCompleto || 'Sucursal Central (Barrio Lindo)'}</span>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* Main Two-Column Layout (8 cols + 4 cols)                  */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
          {/* Left Column: Products List & Delivery Mode (approx 65% = 8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-space-xl">
            {/* Cart Items Box */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-[0_4px_12px_-2px_rgba(30,20,15,0.04),0_12px_32px_-4px_rgba(30,20,15,0.07)]">
              <div className="flex items-center justify-between pb-space-md mb-space-md border-b border-surface-container">
                <h2 className="font-title-sm text-title-sm text-on-surface font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">inventory_2</span>
                  Detalle de Productos
                </h2>
                {cartItems.length > 0 && (
                  <button
                    type="button"
                    className="font-label-interactive text-label-interactive text-on-surface-variant hover:text-error transition-colors flex items-center gap-1 cursor-pointer"
                    onClick={vaciarCarrito}
                  >
                    <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                    Vaciar carrito
                  </button>
                )}
              </div>

              {/* Items List */}
              {cartItems.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant mb-4">
                    <span className="material-symbols-outlined text-[32px]">shopping_basket</span>
                  </div>
                  <h3 className="font-title-sm text-title-sm font-semibold text-on-surface mb-2">
                    Tu carrito está vacío
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mb-6">
                    Explora nuestros sofás, poltronas y colchones sommier en cualquiera de las 3 salas de Santa Cruz.
                  </p>
                  <button
                    type="button"
                    className="px-6 py-3 bg-primary text-on-primary rounded-full font-label-interactive text-label-interactive font-bold hover:bg-primary-container shadow-md transition-all cursor-pointer flex items-center gap-2"
                    onClick={() => onNavegar('catalogo')}
                  >
                    <span className="material-symbols-outlined text-[18px]">storefront</span>
                    Explorar Catálogo
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-surface-container-low">
                  {cartItems.map((item) => {
                    const subtotalItem = item.precio * item.cantidad;
                    return (
                      <div
                        key={item.id}
                        className="cart-product-row flex flex-col sm:flex-row sm:items-center justify-between gap-space-md py-space-md transition-colors hover:bg-surface-container-low/30 px-2 rounded-lg"
                      >
                        <div className="flex items-center gap-space-md min-w-0">
                          <div
                            className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-surface-container-low shrink-0 relative cursor-pointer"
                            onClick={() => onVerDetalle && onVerDetalle(item)}
                            title="Ver ficha técnica"
                          >
                            <img
                              className="w-full h-full object-cover"
                              src={item.src}
                              alt={item.nombre}
                              loading="lazy"
                            />
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-surface-container-lowest/90 font-label-subtle text-[10px] font-bold text-primary">
                              {item.tag || 'TERRA'}
                            </span>
                          </div>
                          <div className="min-w-0 flex flex-col gap-1">
                            <p className="font-label-subtle text-label-subtle text-on-surface-variant uppercase tracking-wider">
                              SKU: {item.sku || 'TER-SCZ'} · Terra Rest
                            </p>
                            <h3
                              className="font-title-sm text-title-sm text-on-surface font-semibold truncate cursor-pointer hover:text-primary transition-colors"
                              onClick={() => onVerDetalle && onVerDetalle(item)}
                            >
                              {item.nombre}
                            </h3>
                            <div className="flex items-center gap-1.5 text-tertiary font-label-subtle text-label-subtle">
                              <span className="material-symbols-outlined text-[16px]">storefront</span>
                              <span>
                                Disponible para retiro inmediato en <strong>{sucursalActiva?.nombreCompleto || 'Sucursal Central (Barrio Lindo)'}</strong>
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <button
                                type="button"
                                className="font-label-subtle text-label-subtle text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
                                onClick={() => alert('Producto guardado en tu lista de deseos')}
                              >
                                <span className="material-symbols-outlined text-[15px]">favorite_border</span> Guardar para después
                              </button>
                              <button
                                type="button"
                                className="font-label-subtle text-label-subtle text-error hover:underline flex items-center gap-1 cursor-pointer"
                                onClick={() => eliminarItem(item.id)}
                              >
                                <span className="material-symbols-outlined text-[15px]">delete</span> Eliminar
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Price & Quantity Cluster */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-space-sm pt-2 sm:pt-0">
                          <div className="text-left sm:text-right">
                            <p className="font-label-subtle text-label-subtle text-on-surface-variant">Precio Unitario</p>
                            <p className="font-body-md text-body-md text-on-surface font-medium">{formatBs(item.precio)}</p>
                          </div>
                          {/* Quantity Selector */}
                          <div className="flex items-center bg-surface-container-low rounded-full p-1 shadow-sm">
                            <button
                              type="button"
                              aria-label="Disminuir"
                              className="w-8 h-8 rounded-full bg-surface-container-lowest text-on-surface hover:bg-surface-container-high flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
                              onClick={() => cambiarCantidad(item.id, -1)}
                            >
                              <span className="material-symbols-outlined text-[16px]">remove</span>
                            </button>
                            <span className="w-10 text-center font-label-interactive text-label-interactive font-bold text-on-surface">
                              {item.cantidad}
                            </span>
                            <button
                              type="button"
                              aria-label="Aumentar"
                              className="w-8 h-8 rounded-full bg-surface-container-lowest text-on-surface hover:bg-surface-container-high flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
                              onClick={() => cambiarCantidad(item.id, 1)}
                            >
                              <span className="material-symbols-outlined text-[16px]">add</span>
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="font-label-subtle text-label-subtle text-on-surface-variant">Subtotal</p>
                            <p className="font-title-sm text-title-sm font-bold text-primary">{formatBs(subtotalItem)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bottom Row Actions */}
              <div className="pt-space-lg mt-space-md border-t border-surface-container flex flex-col sm:flex-row items-center justify-between gap-space-md">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 font-label-interactive text-label-interactive text-on-surface hover:text-primary transition-colors cursor-pointer"
                  onClick={() => onNavegar('catalogo')}
                >
                  <span className="material-symbols-outlined text-[20px]">west</span>
                  Seguir explorando muebles & colchones
                </button>
                <div className="flex items-center gap-2 text-on-surface-variant font-label-subtle text-label-subtle">
                  <span className="material-symbols-outlined text-primary text-[18px]">lock</span>
                  Reserva de stock asegurada por 20 minutos
                </div>
              </div>
            </div>

            {/* Santa Cruz Delivery Method Selector Module */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-[0_4px_12px_-2px_rgba(30,20,15,0.04)]">
              <div className="flex items-center justify-between mb-space-md">
                <div>
                  <h2 className="font-title-sm text-title-sm text-on-surface font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[22px]">where_to_vote</span>
                    Modalidad de Entrega en Santa Cruz
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Selecciona si deseas retirar de forma inmediata sin costo en showroom o agendar entrega en tu dirección.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded bg-secondary-container text-on-secondary-container font-label-subtle text-label-subtle font-semibold">
                  SCZ Metropolitan Area
                </span>
              </div>

              {/* Interactive Mode Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md mb-space-lg">
                {/* Mode 1: Pick up in Showroom */}
                <label
                  className={`delivery-option-card relative flex flex-col p-space-md rounded-xl cursor-pointer transition-all border-2 shadow-sm hover:shadow-md ${
                    modalidadEntrega === 'pickup'
                      ? 'border-primary bg-surface-container-low'
                      : 'border-transparent bg-surface-container hover:border-surface-container-highest'
                  }`}
                  onClick={() => setModalidadEntrega('pickup')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          modalidadEntrega === 'pickup' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">storefront</span>
                      </div>
                      <span className="font-title-sm text-title-sm font-semibold text-on-surface">Retiro en Showroom</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed/30 text-tertiary font-label-subtle text-[11px] font-bold">
                      GRATIS
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-3">
                    Preparamos tu orden inmediatamente. Retiras hoy mismo presentando tu carnet o código QR.
                  </p>
                  <div className="flex items-center gap-1.5 font-label-subtle text-label-subtle text-primary font-semibold">
                    <span className="material-symbols-outlined text-[16px]">bolt</span>
                    Listo en 30 minutos tras confirmación
                  </div>
                  <input
                    type="radio"
                    name="delivery_method"
                    value="pickup"
                    checked={modalidadEntrega === 'pickup'}
                    onChange={() => setModalidadEntrega('pickup')}
                    className="absolute top-4 right-4 opacity-0 pointer-events-none"
                  />
                </label>

                {/* Mode 2: Home Delivery Express */}
                <label
                  className={`delivery-option-card relative flex flex-col p-space-md rounded-xl cursor-pointer transition-all border-2 shadow-sm hover:shadow-md ${
                    modalidadEntrega === 'delivery'
                      ? 'border-primary bg-surface-container-low'
                      : 'border-transparent bg-surface-container hover:border-surface-container-highest'
                  }`}
                  onClick={() => setModalidadEntrega('delivery')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          modalidadEntrega === 'delivery' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                      </div>
                      <span className="font-title-sm text-title-sm font-semibold text-on-surface">Envío a Domicilio</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-label-subtle text-[11px] font-bold">
                      CON COMISIÓN
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-3">
                    Despacho coordinado en Santa Cruz. Tarifa de flete y comisión según zona de entrega.
                  </p>
                  <div className="flex items-center gap-1.5 font-label-subtle text-label-subtle text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    Horarios flexibles: Mañana o Tarde
                  </div>
                  <input
                    type="radio"
                    name="delivery_method"
                    value="delivery"
                    checked={modalidadEntrega === 'delivery'}
                    onChange={() => setModalidadEntrega('delivery')}
                    className="absolute top-4 right-4 opacity-0 pointer-events-none"
                  />
                </label>
              </div>

              {/* Pickup Branch Detailed Selector */}
              {modalidadEntrega === 'pickup' && (
                <div className="p-space-md bg-surface-container-low rounded-xl" id="pickup-branch-panel">
                  <label className="block font-label-interactive text-label-interactive text-on-surface font-semibold mb-2">
                    Selecciona sala de retiro en Santa Cruz:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
                    <div
                      className={`p-3 rounded-lg shadow-sm flex items-start gap-3 cursor-pointer transition-colors ${
                        salaRetiroSeleccionada === 'central'
                          ? 'bg-primary/5 ring-2 ring-primary'
                          : 'bg-surface-container-lowest hover:bg-surface-bright'
                      }`}
                      onClick={() => setSalaRetiroSeleccionada('central')}
                    >
                      <input
                        type="radio"
                        id="br-central"
                        name="pickup_branch"
                        checked={salaRetiroSeleccionada === 'central'}
                        onChange={() => setSalaRetiroSeleccionada('central')}
                        className="mt-1 accent-primary cursor-pointer"
                      />
                      <label className="cursor-pointer" htmlFor="br-central">
                        <p className="font-label-interactive text-label-interactive font-semibold text-on-surface">Sucursal Central</p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">Av. Carmelo Ortiz #3795 (Barrio Lindo)</p>
                        <span className="inline-block mt-1 font-label-subtle text-label-subtle text-tertiary font-bold">
                          ● Stock Total Inmediato
                        </span>
                      </label>
                    </div>

                    <div
                      className={`p-3 rounded-lg shadow-sm flex items-start gap-3 cursor-pointer transition-colors ${
                        salaRetiroSeleccionada === 'norte'
                          ? 'bg-primary/5 ring-2 ring-primary'
                          : 'bg-surface-container-lowest hover:bg-surface-bright'
                      }`}
                      onClick={() => setSalaRetiroSeleccionada('norte')}
                    >
                      <input
                        type="radio"
                        id="br-norte"
                        name="pickup_branch"
                        checked={salaRetiroSeleccionada === 'norte'}
                        onChange={() => setSalaRetiroSeleccionada('norte')}
                        className="mt-1 accent-primary cursor-pointer"
                      />
                      <label className="cursor-pointer" htmlFor="br-norte">
                        <p className="font-label-interactive text-label-interactive font-semibold text-on-surface">Sucursal Norte</p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">4to Anillo (Frente a SEARPI)</p>
                        <span className="inline-block mt-1 font-label-subtle text-label-subtle text-tertiary font-bold">
                          ● Listo en 30 min
                        </span>
                      </label>
                    </div>

                    <div
                      className={`p-3 rounded-lg shadow-sm flex items-start gap-3 cursor-pointer transition-colors ${
                        salaRetiroSeleccionada === 'sur'
                          ? 'bg-primary/5 ring-2 ring-primary'
                          : 'bg-surface-container-lowest hover:bg-surface-bright'
                      }`}
                      onClick={() => setSalaRetiroSeleccionada('sur')}
                    >
                      <input
                        type="radio"
                        id="br-sur"
                        name="pickup_branch"
                        checked={salaRetiroSeleccionada === 'sur'}
                        onChange={() => setSalaRetiroSeleccionada('sur')}
                        className="mt-1 accent-primary cursor-pointer"
                      />
                      <label className="cursor-pointer" htmlFor="br-sur">
                        <p className="font-label-interactive text-label-interactive font-semibold text-on-surface">Sucursal Sur</p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">4to Anillo (Radial 10 y San Aurelio)</p>
                        <span className="inline-block mt-1 font-label-subtle text-label-subtle text-tertiary font-bold">
                          ● Listo en 30 min
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Value-Added Services & Warranties Section */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-[0_4px_12px_-2px_rgba(30,20,15,0.04)]">
              <h2 className="font-title-sm text-title-sm text-on-surface font-semibold flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-tertiary text-[22px]">verified_user</span>
                Servicios y Garantías Opcionales
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
                Maximiza la durabilidad de tus muebles con los programas de asistencia certificados TERRA.
              </p>
              <div className="space-y-space-sm">
                <label className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addonProteccion}
                    onChange={(e) => setAddonProteccion(e.target.checked)}
                    className="mt-1 accent-primary h-4 w-4 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-label-interactive text-label-interactive font-semibold text-on-surface">
                        Protección Extendida Nano-Shield contra Líquidos y Manchas
                      </p>
                      <span className="font-label-interactive text-label-interactive font-bold text-primary">+Bs 120,00</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Tratamiento hidrofóbico aplicado por especialistas de sala previo a la entrega. Repele derrames de café, vino y grasa durante 24 meses.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer">
                  <input type="checkbox" checked readOnly className="mt-1 accent-primary h-4 w-4" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="font-label-interactive text-label-interactive font-semibold text-on-surface">
                          Armado & Calibración de Sofá Cama en Sala
                        </p>
                        <span className="px-2 py-0.5 rounded bg-tertiary-fixed/30 text-tertiary font-label-subtle text-[11px] font-bold">
                          INCLUIDO GRATIS
                        </span>
                      </div>
                      <span className="font-label-subtle text-label-subtle text-on-surface-variant line-through">Bs 80,00</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Personal técnico instala el mueble en tu habitación y retira todos los embalajes sin ensuciar tu casa.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Checkout Summary & Payment Methods (approx 35% = 4 cols) */}
          <div className="lg:col-span-4 sticky top-48 flex flex-col gap-space-md">
            {/* Summary Card */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-[0_8px_24px_-4px_rgba(30,20,15,0.08),0_24px_48px_-8px_rgba(30,20,15,0.12)]">
              <h2 className="font-title-sm text-title-sm text-on-surface font-bold flex items-center justify-between pb-space-sm border-b border-surface-container mb-space-md">
                <span>Resumen del Pedido</span>
                <span className="material-symbols-outlined text-primary text-[20px]">receipt_long</span>
              </h2>

              {/* Coupon Input */}
              <div className="mb-space-md">
                <label className="block font-label-subtle text-label-subtle text-on-surface-variant font-medium mb-1.5">
                  Cupón o Código de Kiosco Showroom:
                </label>
                <form onSubmit={aplicarCupon} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={cuponInput}
                      onChange={(e) => setCuponInput(e.target.value)}
                      placeholder="Ingresa código..."
                      className="w-full h-11 pl-9 pr-3 rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 uppercase tracking-wider"
                    />
                    <span className="material-symbols-outlined absolute left-2.5 top-3 text-[18px] text-on-surface-variant">
                      local_activity
                    </span>
                  </div>
                  <button
                    type="submit"
                    className="h-11 px-4 rounded-lg bg-secondary-container hover:bg-surface-container-high text-on-secondary-container font-label-interactive text-label-interactive transition-colors cursor-pointer"
                  >
                    Aplicar
                  </button>
                </form>
                {cuponMensaje && (
                  <p
                    className={`mt-1 font-label-subtle text-label-subtle flex items-center gap-1 ${
                      cuponValido ? 'text-primary font-bold' : 'text-error'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {cuponValido ? 'check' : 'error'}
                    </span>
                    {cuponMensaje}
                  </p>
                )}
              </div>

              {/* Breakdown */}
              <div className="space-y-space-sm font-body-md text-body-md pb-space-md border-b border-surface-container">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span>Subtotal Productos ({totalArticulos})</span>
                  <span className="font-medium text-on-surface">{formatBs(subtotalProductos)}</span>
                </div>
                {descuentoAutoservicio > 0 && (
                  <div className="flex items-center justify-between text-primary font-bold">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">sell</span>
                      Descuento Autoservicio Showroom
                    </span>
                    <span className="font-bold">-{formatBs(descuentoAutoservicio)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                    Modalidad de Entrega
                  </span>
                  <span className={`font-bold uppercase font-label-interactive text-[13px] ${modalidadEntrega === 'pickup' ? 'text-tertiary' : 'text-on-surface'}`}>
                    {modalidadEntrega === 'pickup' ? 'RETIRO SIN COSTO' : 'FLETE CON COMISIÓN'}
                  </span>
                </div>
                {costoServicios > 0 && (
                  <div className="flex items-center justify-between text-on-surface-variant">
                    <span>Servicios y Garantías</span>
                    <span className="font-medium text-on-surface">+{formatBs(costoServicios)}</span>
                  </div>
                )}
              </div>

              {/* Total Highlight */}
              <div className="py-space-md">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="font-title-sm text-title-sm text-on-surface font-bold">Total a Pagar</span>
                    <p className="font-label-subtle text-label-subtle text-on-surface-variant">Incluye Factura con Crédito Fiscal</p>
                  </div>
                  <div className="text-right">
                    <span className="font-headline-lg text-headline-lg font-bold text-primary tracking-tight">
                      {formatBs(totalPagar)}
                    </span>
                    <p className="font-label-subtle text-label-subtle text-on-surface-variant font-medium">Moneda Nacional (BOB)</p>
                  </div>
                </div>
              </div>

              {/* Primary CTA Button */}
              <button
                type="button"
                className="w-full py-4 px-space-md rounded-full bg-primary hover:bg-primary-container text-on-primary font-label-interactive text-label-interactive text-[16px] shadow-[0_10px_28px_-6px_rgba(179,19,41,0.42),0_4px_12px_-2px_rgba(179,19,41,0.25)] flex items-center justify-center gap-2 group transition-all active:scale-[0.99] cursor-pointer"
                onClick={onProcederPago}
              >
                <span>Proceder al Pago / Finalizar Compra</span>
                <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
              </button>

              {/* Quick QR Button */}
              <button
                type="button"
                className="w-full mt-space-sm py-3 px-space-md rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface font-label-interactive text-label-interactive flex items-center justify-center gap-2 transition-colors cursor-pointer"
                onClick={onProcederPago}
              >
                <span className="material-symbols-outlined text-primary text-[20px]">qr_code_2</span>
                <span>Pagar con QR Simple en Kiosco / Móvil</span>
              </button>

              {/* Accepted Payment Methods */}
              <div className="mt-space-lg pt-space-md border-t border-surface-container">
                <p className="font-label-subtle text-label-subtle text-on-surface-variant uppercase tracking-wider mb-2.5 text-center">
                  Medios de Pago Autorizados
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-surface-container text-on-surface font-label-subtle text-[11px] font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-primary">qr_code</span> QR Simple
                  </span>
                  <span className="px-2.5 py-1 rounded bg-surface-container text-on-surface font-label-subtle text-[11px] font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">credit_card</span> Visa / Mastercard
                  </span>
                  <span className="px-2.5 py-1 rounded bg-surface-container text-on-surface font-label-subtle text-[11px] font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">payments</span> Efectivo en Caja
                  </span>
                  <span className="px-2.5 py-1 rounded bg-surface-container text-on-surface font-label-subtle text-[11px] font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">account_balance</span> Transf. Bancaria
                  </span>
                </div>
              </div>
            </div>

            {/* Trust Badges Card */}
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-[0_4px_12px_-2px_rgba(30,20,15,0.04)] space-y-space-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                </div>
                <div>
                  <p className="font-label-interactive text-label-interactive font-semibold text-on-surface">Compra 100% Protegida</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Respaldo legal TERRA Muebles S.R.L.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">shield</span>
                </div>
                <div>
                  <p className="font-label-interactive text-label-interactive font-semibold text-on-surface">Garantía Directa de Fábrica</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">1 año en resortes y maderas curadas.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">support_agent</span>
                </div>
                <div>
                  <p className="font-label-interactive text-label-interactive font-semibold text-on-surface">Asistencia Santa Cruz</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Mesa de ayuda: +591 75335697</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* Cross-Selling / "Completa tu Descanso" Section            */}
        {/* ========================================================= */}
        <section className="mt-space-2xl pt-space-xl border-t border-surface-container">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg">
            <div>
              <span className="font-label-caps text-label-caps uppercase text-primary tracking-widest font-bold">
                Complementos sugeridos
              </span>
              <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold mt-1">
                Completa Tu Espacio de Descanso
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Añade con un clic los accesorios de tapicería y cuidado más recomendados por nuestros interioristas de showroom.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 font-label-interactive text-label-interactive text-primary font-semibold hover:underline cursor-pointer"
              onClick={() => onNavegar('catalogo', 'accesorios')}
            >
              Ver todos los accesorios <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>

          {/* 4 Cross-Selling Products Bento/Grid */}
          {complementos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
              {complementos.map((prod) => (
                <div
                  key={prod.id}
                  className="group bg-surface-container-lowest rounded-xl p-space-md shadow-[0_4px_12px_-2px_rgba(30,20,15,0.04)] hover:shadow-[0_12px_32px_-4px_rgba(30,20,15,0.08)] transition-all flex flex-col justify-between cursor-pointer"
                  onClick={() => onVerDetalle?.(prod) || onNavegar('detalle', 'todas', prod)}
                >
                  <div>
                    <div className="w-full h-44 rounded-lg bg-surface-container-low overflow-hidden relative mb-space-sm flex items-center justify-center p-2">
                      <img
                        className="w-full h-full object-contain transition-transform group-hover:scale-105 duration-300"
                        src={prod.imagen || prod.src || prod.imagenes?.[0]}
                        alt={prod.nombre}
                        loading="lazy"
                      />
                      {prod.enOferta && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-primary text-on-primary font-label-subtle text-[11px] font-bold">
                          Oferta
                        </span>
                      )}
                    </div>
                    <p className="font-label-subtle text-label-subtle text-on-surface-variant uppercase">{prod.categoria}</p>
                    <h3 className="font-title-sm text-title-sm text-on-surface font-semibold mt-0.5 line-clamp-1">
                      {prod.nombre}
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 line-clamp-2">
                      {prod.descripcion}
                    </p>
                  </div>
                  <div className="pt-space-md mt-space-sm border-t border-surface-container flex items-center justify-between">
                    <div>
                      <p className="font-title-sm text-title-sm font-bold text-primary">{formatBs(prod.precio)}</p>
                      <span className="font-label-subtle text-label-subtle text-tertiary font-semibold">En stock</span>
                    </div>
                    <button
                      type="button"
                      className="w-9 h-9 rounded-full bg-primary text-on-primary hover:bg-primary-container flex items-center justify-center transition-transform active:scale-95 shadow-sm cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAgregarAlCarrito(prod);
                      }}
                      title="Agregar al carrito"
                    >
                      <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
