import { useEffect, useState } from 'react';

function formatBs(val) {
  return 'Bs ' + Number(val || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CheckoutPage({
  cartItems = [],
  sucursalActiva,
  onNavegar,
  onFinalizarCompra,
}) {
  // Tabs: Retiro en sala vs Domicilio
  const [modalidadEntrega, setModalidadEntrega] = useState('retiro'); // 'retiro' | 'domicilio'
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(sucursalActiva?.nombreCompleto || 'Sucursal Central (Barrio Lindo)');
  const [mostrarOtrasSalas, setMostrarOtrasSalas] = useState(false);

  // Cliente Registrado (Según requerimiento: cliente ya registrado con su cuenta/perfil)
  const [perfilCliente] = useState({
    nombre: 'Rodrigo Aguilera Montero',
    tipoCliente: 'Cliente Registrado · Personal & Familiar',
    telefono: '77089421',
    correo: 'r.aguilera@empresarial.bo',
    ci: '6291048 SCZ',
  });

  // Facturación SIN (Pre-cargada con datos del cliente registrado)
  const [tipoDoc, setTipoDoc] = useState('NIT'); // 'NIT' | 'CI'
  const [numDoc, setNumDoc] = useState('10293847012');
  const [razonSocial, setRazonSocial] = useState('AGUILERA MONTERO IMPORT & DESIGN S.R.L.');
  const [correoFactura, setCorreoFactura] = useState('contabilidad@aguilera.bo');
  const [ciudadExp, setCiudadExp] = useState('Santa Cruz (SCZ)');

  // Pasarela de pago: 'qr' | 'card' | 'caja' | 'transfer'
  const [metodoPago, setMetodoPago] = useState('qr');

  // Temporizador regresivo para el QR (15 minutos)
  const [segundosQr, setSegundosQr] = useState(888);

  useEffect(() => {
    if (metodoPago !== 'qr') return;
    const interval = setInterval(() => {
      setSegundosQr((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [metodoPago]);

  const minQr = Math.floor(segundosQr / 60);
  const secQr = segundosQr % 60;
  const tiempoQrTexto = `${minQr}:${secQr < 10 ? '0' : ''}${secQr} min`;

  // Cálculos de totales
  const totalArticulos = cartItems.reduce((acc, it) => acc + it.cantidad, 0);
  const subtotalProductos = cartItems.reduce((acc, it) => acc + it.precio * it.cantidad, 0);
  const descuentoPromocion = subtotalProductos > 100 ? 120 : 0;
  const totalPagar = Math.max(0, subtotalProductos - descuentoPromocion);

  const handleTipoDocChange = (nuevoTipo) => {
    setTipoDoc(nuevoTipo);
    if (nuevoTipo === 'CI') {
      setNumDoc('6291048');
      setRazonSocial('RODRIGO AGUILERA MONTERO');
    } else {
      setNumDoc('10293847012');
      setRazonSocial('AGUILERA MONTERO IMPORT & DESIGN S.R.L.');
    }
  };

  return (
    <div className="flex flex-col w-full bg-surface">
      {/* ========================================================= */}
      {/* STEPPER BREADCRUMB CONTEXT BANNER                         */}
      {/* ========================================================= */}
      <section className="w-full bg-surface-container-low py-space-md border-b border-surface-container">
        <div className="max-w-7xl mx-auto px-margin">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-space-md">
            {/* Title & Back Action */}
            <div className="flex items-center gap-space-md">
              <button
                type="button"
                className="w-10 h-10 rounded-full bg-surface-container-lowest text-on-surface hover:bg-surface-container-high flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                onClick={() => onNavegar('carrito')}
                title="Volver al Carrito"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <div>
                <div className="flex items-center gap-space-xs font-label-subtle text-label-subtle text-primary font-bold uppercase tracking-wider">
                  <span>Checkout Autoservicio</span>
                  <span>•</span>
                  <span className="text-on-surface-variant">Santa Cruz de la Sierra</span>
                </div>
                <h1 className="font-headline-md text-headline-md text-on-surface font-bold">
                  Finalizar Compra y Pago Seguro
                </h1>
              </div>
            </div>

            {/* Stepper Progress Tracker */}
            <div className="flex items-center gap-2 bg-surface-container-lowest p-2 rounded-full shadow-sm max-w-xl">
              {/* Step 1: Carrito (Done) */}
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-high text-on-surface cursor-pointer hover:bg-surface-container"
                onClick={() => onNavegar('carrito')}
              >
                <span className="w-6 h-6 rounded-full bg-primary text-on-primary font-label-subtle text-label-subtle flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[14px]">check</span>
                </span>
                <span className="font-label-subtle text-label-subtle hidden sm:inline font-semibold">1. Carrito</span>
              </button>
              <span className="material-symbols-outlined text-outline-variant text-[16px]">chevron_right</span>

              {/* Step 2: Entrega & Facturación (Active) */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary text-on-primary shadow-sm">
                <span className="w-6 h-6 rounded-full bg-on-primary text-primary font-label-subtle text-label-subtle flex items-center justify-center font-bold">
                  2
                </span>
                <span className="font-label-subtle text-label-subtle font-bold">2. Entrega y Pago</span>
              </div>
              <span className="material-symbols-outlined text-outline-variant text-[16px]">chevron_right</span>

              {/* Step 3: Confirmación (Next) */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-on-surface-variant opacity-60">
                <span className="w-6 h-6 rounded-full bg-surface-container-high text-on-surface-variant font-label-subtle text-label-subtle flex items-center justify-center font-bold">
                  3
                </span>
                <span className="font-label-subtle text-label-subtle hidden sm:inline">3. Confirmación</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* MAIN CHECKOUT CONTENT GRID                                */}
      {/* ========================================================= */}
      <div className="max-w-7xl mx-auto px-margin py-space-xl w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
          {/* ==================== LEFT COLUMN: FLOW ==================== */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-space-lg">
            {/* 1. IDENTIFICACIÓN DE CLIENTE REGISTRADO */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-container">
              <div className="flex items-center justify-between mb-space-md">
                <div className="flex items-center gap-space-sm">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold font-title-sm text-title-sm">
                    1
                  </div>
                  <div>
                    <h2 className="font-title-sm text-title-sm text-on-surface font-bold">
                      Cuenta y Datos del Comprador
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Sesión activa con cuenta cliente verificada para compras en Santa Cruz
                    </p>
                  </div>
                </div>
                <span className="font-label-subtle text-label-subtle bg-tertiary-fixed/30 text-on-surface px-3 py-1 rounded-full font-semibold flex items-center gap-1.5 border border-tertiary-fixed-dim/40">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  Cliente Verificado
                </span>
              </div>

              {/* Verified Profile Card */}
              <div className="bg-surface-container-low p-4 rounded-xl border border-surface-container">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-lg shrink-0">
                      RA
                    </div>
                    <div>
                      <p className="font-title-sm text-title-sm font-bold text-on-surface">
                        {perfilCliente.nombre}
                      </p>
                      <p className="font-label-subtle text-label-subtle text-primary font-semibold">
                        {perfilCliente.tipoCliente}
                      </p>
                    </div>
                  </div>
                  <span className="self-start sm:self-center font-label-subtle text-label-subtle bg-surface-container-lowest text-on-surface-variant px-3 py-1.5 rounded-lg border border-surface-container shadow-sm">
                    C.I.: {perfilCliente.ci}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-3 border-t border-surface-container font-body-sm text-body-sm">
                  <div className="flex items-center gap-2 text-on-surface">
                    <span className="material-symbols-outlined text-primary text-[18px]">chat</span>
                    <span>
                      WhatsApp: <strong>+591 {perfilCliente.telefono}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-on-surface">
                    <span className="material-symbols-outlined text-primary text-[18px]">mail</span>
                    <span>
                      Correo: <strong>{perfilCliente.correo}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* B2B / Facturación Especial Notice */}
              <div className="mt-space-md flex items-center justify-between bg-surface-container-low p-3 rounded-lg border border-surface-container-high">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-primary text-[20px]">apartment</span>
                  <div>
                    <p className="font-label-interactive text-label-interactive text-on-surface font-semibold">
                      ¿Compra corporativa o amoblamiento comercial?
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant text-[12px]">
                      Cotización especial y asesoría directa en showroom disponible con tu cuenta.
                    </p>
                  </div>
                </div>
                <span className="font-label-subtle text-label-subtle text-primary font-bold px-2.5 py-1 bg-surface-container-lowest rounded-full">
                  Habilitado
                </span>
              </div>
            </div>

            {/* 2. MODALIDAD DE ENTREGA Y SUCURSAL SANTA CRUZ */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-container">
              <div className="flex items-center justify-between mb-space-md">
                <div className="flex items-center gap-space-sm">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold font-title-sm text-title-sm">
                    2
                  </div>
                  <div>
                    <h2 className="font-title-sm text-title-sm text-on-surface font-bold">
                      Modalidad de Entrega
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Elige retiro rápido en sala o flete especializado en Santa Cruz
                    </p>
                  </div>
                </div>
              </div>

              {/* Selector de Pestañas Retiro vs Domicilio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm p-1.5 bg-surface-container-low rounded-xl mb-space-md">
                {/* Opción Retiro */}
                <button
                  type="button"
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-label-interactive text-label-interactive transition-all text-left cursor-pointer ${
                    modalidadEntrega === 'retiro'
                      ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                  onClick={() => setModalidadEntrega('retiro')}
                >
                  <span className="material-symbols-outlined text-[22px]">storefront</span>
                  <div className="leading-tight">
                    <span className="block font-bold">Retiro en Showroom</span>
                    <span className="font-label-subtle text-label-subtle text-primary font-semibold">
                      GRATIS • Listo en 30 min
                    </span>
                  </div>
                </button>

                {/* Opción Domicilio */}
                <button
                  type="button"
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-label-interactive text-label-interactive transition-all text-left cursor-pointer ${
                    modalidadEntrega === 'domicilio'
                      ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                  onClick={() => setModalidadEntrega('domicilio')}
                >
                  <span className="material-symbols-outlined text-[22px]">local_shipping</span>
                  <div className="leading-tight">
                    <span className="block font-bold text-on-surface">Envío a Domicilio</span>
                    <span className="font-label-subtle text-label-subtle text-on-surface-variant">
                      Flete con comisión según zona
                    </span>
                  </div>
                </button>
              </div>

              {/* PANEL RETIRO EN SUCURSAL */}
              {modalidadEntrega === 'retiro' && (
                <div className="space-y-space-md" id="panel-retiro">
                  <div className="bg-surface-container-low p-space-md rounded-xl border border-surface-container">
                    <div className="flex items-start justify-between gap-space-md mb-space-sm">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[22px]">pin_drop</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-title-sm text-title-sm text-on-surface font-bold">
                              {sucursalSeleccionada}
                            </h3>
                            <span className="bg-primary/10 text-primary font-label-subtle text-label-subtle font-bold px-2 py-0.5 rounded-full">
                              Seleccionada
                            </span>
                          </div>
                          <p className="font-body-sm text-body-sm text-on-surface-variant">
                            {sucursalSeleccionada.includes('Norte')
                              ? '4to Anillo, entre Av. Alemana y Av. 2 de Agosto (Frente al SEARPI / Banco de Sangre)'
                              : sucursalSeleccionada.includes('Sur')
                              ? '4to Anillo, entre Radial 10 y Av. San Aurelio'
                              : 'Av. Carmelo Ortiz #3795, entre 3er y 4to anillo (Zona Nueva Feria Barrio Lindo)'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="px-3.5 py-1.5 rounded-full bg-surface-container-lowest hover:bg-surface-container-high text-primary font-label-interactive text-label-interactive text-[13px] transition-colors shadow-sm cursor-pointer shrink-0"
                        onClick={() => setMostrarOtrasSalas((prev) => !prev)}
                      >
                        {mostrarOtrasSalas ? 'Cerrar' : 'Cambiar Sala'}
                      </button>
                    </div>

                    {/* Badges de disponibilidad y horarios */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-space-xs text-on-surface-variant font-body-sm text-body-sm">
                      <div className="flex items-center gap-1.5 bg-surface-container-lowest p-2 rounded-lg">
                        <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
                        <span>Stock en Sala: <strong>Disponible</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-surface-container-lowest p-2 rounded-lg">
                        <span className="material-symbols-outlined text-primary text-[18px]">schedule</span>
                        <span>Horario: <strong>08:00 a 20:00</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-surface-container-lowest p-2 rounded-lg">
                        <span className="material-symbols-outlined text-primary text-[18px]">electric_car</span>
                        <span>Parqueo de Carga: <strong>Gratis</strong></span>
                      </div>
                    </div>

                    {/* Selector de salas alternativas */}
                    {mostrarOtrasSalas && (
                      <div className="mt-space-md pt-space-md border-t border-surface-container space-y-2">
                        <p className="font-label-interactive text-label-interactive text-on-surface mb-2 font-semibold">
                          Seleccionar otra sala con stock disponible en Santa Cruz:
                        </p>
                        {[
                          {
                            nombre: 'Sucursal Central (Barrio Lindo)',
                            detalle: 'Av. Carmelo Ortiz #3795, entre 3er y 4to anillo • Lun a Sáb 08:00-20:00, Dom 09:00-15:00',
                            tiempo: 'Stock Inmediato',
                          },
                          {
                            nombre: 'Sucursal Norte (SEARPI)',
                            detalle: '4to Anillo, entre Av. Alemana y Av. 2 de Agosto (Frente al SEARPI) • Retiro en 30 min',
                            tiempo: 'Listo en 30 min',
                          },
                          {
                            nombre: 'Sucursal Sur (Radial 10)',
                            detalle: '4to Anillo, entre Radial 10 y Av. San Aurelio • Retiro en 30 min',
                            tiempo: 'Listo en 30 min',
                          },
                        ].map((sala, idx) => (
                          <label
                            key={idx}
                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                              sucursalSeleccionada === sala.nombre
                                ? 'bg-primary/5 ring-1 ring-primary'
                                : 'bg-surface-container-lowest hover:bg-surface-container-high'
                            }`}
                            onClick={() => {
                              setSucursalSeleccionada(sala.nombre);
                              setMostrarOtrasSalas(false);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="sucursal_pick"
                                checked={sucursalSeleccionada === sala.nombre}
                                onChange={() => setSucursalSeleccionada(sala.nombre)}
                                className="accent-primary cursor-pointer"
                              />
                              <div>
                                <p className="font-label-interactive text-label-interactive text-on-surface font-semibold">
                                  {sala.nombre}
                                </p>
                                <p className="font-label-subtle text-label-subtle text-on-surface-variant">
                                  {sala.detalle}
                                </p>
                              </div>
                            </div>
                            <span className="font-label-subtle text-label-subtle text-primary font-semibold">
                              {sala.tiempo}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quién retira */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                    <div>
                      <label className="block font-label-interactive text-label-interactive text-on-surface mb-1 font-semibold">
                        ¿Quién retirará el pedido en sala?
                      </label>
                      <select className="w-full h-12 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary shadow-inner">
                        <option>El titular registrado ({perfilCliente.nombre})</option>
                        <option>Tercera persona autorizada (presentar C.I.)</option>
                        <option>Servicio de transporte / flete particular</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-label-interactive text-label-interactive text-on-surface mb-1 font-semibold">
                        C.I. de la persona que retira
                      </label>
                      <input
                        type="text"
                        defaultValue={perfilCliente.ci}
                        className="w-full h-12 px-4 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary shadow-inner font-semibold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* PANEL ENVÍO A DOMICILIO */}
              {modalidadEntrega === 'domicilio' && (
                <div className="space-y-space-md" id="panel-domicilio">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                    <div className="sm:col-span-2">
                      <label className="block font-label-interactive text-label-interactive text-on-surface mb-1 font-semibold">
                        Dirección Exacta en Santa Cruz <span className="text-primary">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Barrio Sirari, Calle Los Claveles #240"
                        defaultValue="Barrio Sirari, Calle Los Ceibos #145"
                        className="w-full h-12 px-4 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="block font-label-interactive text-label-interactive text-on-surface mb-1 font-semibold">
                        Zona / Barrio / Anillo
                      </label>
                      <select className="w-full h-12 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary shadow-inner">
                        <option>Central / Barrio Lindo / 3er - 4to Anillo</option>
                        <option>Norte (Alemana / 2 de Agosto / Banzer)</option>
                        <option>Sur (Radial 10 / San Aurelio / Santos Dumont)</option>
                        <option>Equipetrol / Sirari / Villa Mercedes</option>
                        <option>Urubó / Colinas del Urubó</option>
                        <option>Este (Virgen de Cotoca / Pampa de la Isla)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-label-interactive text-label-interactive text-on-surface mb-1 font-semibold">
                        Referencia para el transportista
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Portón café, frente al parque"
                        defaultValue="Portón negro, timbre derecho"
                        className="w-full h-12 px-4 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
                      />
                    </div>
                  </div>
                  <div className="p-3 bg-surface-container-low rounded-lg flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-[20px]">calendar_clock</span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Franja de entrega sugerida: <strong>Mañana entre 14:00 y 18:00</strong> con cuadrilla y armador oficial de TERRA.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 3. DATOS DE FACTURACIÓN (BOLIVIA / SIN) */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-container">
              <div className="flex items-center justify-between mb-space-md">
                <div className="flex items-center gap-space-sm">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold font-title-sm text-title-sm">
                    3
                  </div>
                  <div>
                    <h2 className="font-title-sm text-title-sm text-on-surface font-bold">
                      Datos de Facturación (Crédito Fiscal SIN)
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Emisión de Factura Electrónica en Línea con código QR oficial
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-on-surface-variant font-label-subtle text-label-subtle">
                  <span className="material-symbols-outlined text-primary text-[18px]">receipt_long</span>
                  <span>Válido p/ descargo</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-space-md">
                {/* Tipo Documento */}
                <div className="sm:col-span-4">
                  <label className="block font-label-interactive text-label-interactive text-on-surface mb-1 font-semibold">
                    Tipo de Documento
                  </label>
                  <select
                    value={tipoDoc}
                    onChange={(e) => handleTipoDocChange(e.target.value)}
                    className="w-full h-12 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary shadow-inner font-semibold cursor-pointer"
                  >
                    <option value="NIT">NIT (Empresa / Persona Natural)</option>
                    <option value="CI">C.I. (Cédula de Identidad)</option>
                  </select>
                </div>

                {/* Número de Documento */}
                <div className="sm:col-span-4">
                  <label className="block font-label-interactive text-label-interactive text-on-surface mb-1 font-semibold">
                    Número de NIT / C.I. <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    value={numDoc}
                    onChange={(e) => setNumDoc(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary shadow-inner font-mono font-semibold"
                  />
                </div>

                {/* Extensión */}
                <div className="sm:col-span-4">
                  <label className="block font-label-interactive text-label-interactive text-on-surface mb-1 font-semibold">
                    Extensión / Ciudad
                  </label>
                  <select
                    value={ciudadExp}
                    onChange={(e) => setCiudadExp(e.target.value)}
                    className="w-full h-12 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
                  >
                    <option>Santa Cruz (SCZ)</option>
                    <option>La Paz (LPZ)</option>
                    <option>Cochabamba (CBB)</option>
                    <option>Chuquisaca (CHQ)</option>
                    <option>Tarija (TJA)</option>
                    <option>Beni (BEN)</option>
                  </select>
                </div>

                {/* Razón Social */}
                <div className="sm:col-span-8">
                  <label className="block font-label-interactive text-label-interactive text-on-surface mb-1 font-semibold">
                    Razón Social o Nombre en Factura <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary shadow-inner uppercase font-semibold"
                  />
                </div>

                {/* Correo Factura */}
                <div className="sm:col-span-4">
                  <label className="block font-label-interactive text-label-interactive text-on-surface mb-1 font-semibold">
                    Envío XML / PDF Factura
                  </label>
                  <input
                    type="email"
                    value={correoFactura}
                    onChange={(e) => setCorreoFactura(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
                  />
                </div>
              </div>
            </div>

            {/* 4. SELECCIÓN DE MÉTODO DE PAGO (PASARELA PROFESIONAL) */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-surface-container">
              <div className="flex items-center justify-between mb-space-md">
                <div className="flex items-center gap-space-sm">
                  <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold font-title-sm text-title-sm">
                    4
                  </div>
                  <div>
                    <h2 className="font-title-sm text-title-sm text-on-surface font-bold">
                      Pasarela de Pago Segura
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Selecciona el método de tu preferencia sin comisiones adicionales
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-on-surface-variant font-label-subtle text-label-subtle">
                  <span className="material-symbols-outlined text-primary text-[16px]">lock</span>
                  <span>Cifrado SSL 256-bit</span>
                </div>
              </div>

              {/* Selector de Medios de Pago (Tabs) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-space-lg">
                {/* Tab 1: QR Simple */}
                <button
                  type="button"
                  className={`p-3 rounded-xl transition-all text-center flex flex-col items-center justify-between gap-1 shadow-sm cursor-pointer ${
                    metodoPago === 'qr'
                      ? 'bg-surface-container-low ring-2 ring-primary opacity-100'
                      : 'bg-surface-container-lowest hover:bg-surface-container-high opacity-70'
                  }`}
                  onClick={() => setMetodoPago('qr')}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-1">
                    <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                  </div>
                  <span className="font-label-interactive text-label-interactive text-on-surface leading-tight font-semibold">
                    QR Simple
                  </span>
                  <span className="font-label-subtle text-label-subtle bg-primary text-on-primary px-1.5 py-0.5 rounded text-[10px] font-bold">
                    Recomendado
                  </span>
                </button>

                {/* Tab 2: Tarjeta */}
                <button
                  type="button"
                  className={`p-3 rounded-xl transition-all text-center flex flex-col items-center justify-between gap-1 shadow-sm cursor-pointer ${
                    metodoPago === 'card'
                      ? 'bg-surface-container-low ring-2 ring-primary opacity-100'
                      : 'bg-surface-container-lowest hover:bg-surface-container-high opacity-70'
                  }`}
                  onClick={() => setMetodoPago('card')}
                >
                  <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center mb-1">
                    <span className="material-symbols-outlined text-[20px]">credit_card</span>
                  </div>
                  <span className="font-label-interactive text-label-interactive text-on-surface leading-tight font-semibold">
                    Tarjeta Débito / Crédito
                  </span>
                  <span className="font-label-subtle text-label-subtle text-on-surface-variant text-[10px]">
                    Visa / Master
                  </span>
                </button>

                {/* Tab 3: Pago en Caja */}
                <button
                  type="button"
                  className={`p-3 rounded-xl transition-all text-center flex flex-col items-center justify-between gap-1 shadow-sm cursor-pointer ${
                    metodoPago === 'caja'
                      ? 'bg-surface-container-low ring-2 ring-primary opacity-100'
                      : 'bg-surface-container-lowest hover:bg-surface-container-high opacity-70'
                  }`}
                  onClick={() => setMetodoPago('caja')}
                >
                  <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center mb-1">
                    <span className="material-symbols-outlined text-[20px]">point_of_sale</span>
                  </div>
                  <span className="font-label-interactive text-label-interactive text-on-surface leading-tight font-semibold">
                    Pago en Caja
                  </span>
                  <span className="font-label-subtle text-label-subtle text-on-surface-variant text-[10px]">
                    Efectivo o POS
                  </span>
                </button>

                {/* Tab 4: Transferencia */}
                <button
                  type="button"
                  className={`p-3 rounded-xl transition-all text-center flex flex-col items-center justify-between gap-1 shadow-sm cursor-pointer ${
                    metodoPago === 'transfer'
                      ? 'bg-surface-container-low ring-2 ring-primary opacity-100'
                      : 'bg-surface-container-lowest hover:bg-surface-container-high opacity-70'
                  }`}
                  onClick={() => setMetodoPago('transfer')}
                >
                  <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center mb-1">
                    <span className="material-symbols-outlined text-[20px]">account_balance</span>
                  </div>
                  <span className="font-label-interactive text-label-interactive text-on-surface leading-tight font-semibold">
                    Transferencia
                  </span>
                  <span className="font-label-subtle text-label-subtle text-on-surface-variant text-[10px]">
                    BCP / BNB
                  </span>
                </button>
              </div>

              {/* CONTENIDO 1: QR SIMPLE BOLIVIA */}
              {metodoPago === 'qr' && (
                <div className="bg-surface-container-low rounded-xl p-space-lg border border-surface-container">
                  <div className="flex flex-col md:flex-row items-center gap-space-lg">
                    {/* QR Code Display Box */}
                    <div className="w-full md:w-64 bg-surface-container-lowest p-space-md rounded-xl flex flex-col items-center text-center shadow-md relative overflow-hidden shrink-0">
                      <div className="w-full flex items-center justify-between mb-2">
                        <span className="font-label-subtle text-label-subtle text-primary font-bold tracking-wider">
                          QR SIMPLE BOLIVIA
                        </span>
                        <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" title="Vigente"></span>
                      </div>

                      {/* SVG Código QR Simulado */}
                      <div className="relative w-48 h-48 bg-white p-2 rounded-lg flex items-center justify-center shadow-inner border border-stone-200">
                        <svg className="w-full h-full text-on-surface" fill="currentColor" viewBox="0 0 120 120">
                          {/* Corner Squares */}
                          <rect fill="#1b1c1a" height="30" rx="3" width="30" x="10" y="10"></rect>
                          <rect fill="#ffffff" height="20" rx="1" width="20" x="15" y="15"></rect>
                          <rect fill="#1b1c1a" height="10" width="10" x="20" y="20"></rect>
                          <rect fill="#1b1c1a" height="30" rx="3" width="30" x="80" y="10"></rect>
                          <rect fill="#ffffff" height="20" rx="1" width="20" x="85" y="15"></rect>
                          <rect fill="#1b1c1a" height="10" width="10" x="90" y="20"></rect>
                          <rect fill="#1b1c1a" height="30" rx="3" width="30" x="10" y="80"></rect>
                          <rect fill="#ffffff" height="20" rx="1" width="20" x="15" y="85"></rect>
                          <rect fill="#1b1c1a" height="10" width="10" x="20" y="90"></rect>
                          {/* Pattern Blocks */}
                          <rect height="6" width="6" x="48" y="12"></rect>
                          <rect height="6" width="6" x="58" y="12"></rect>
                          <rect height="6" width="6" x="68" y="12"></rect>
                          <rect height="6" width="6" x="48" y="24"></rect>
                          <rect height="6" width="6" x="62" y="24"></rect>
                          <rect height="6" width="6" x="48" y="36"></rect>
                          <rect height="6" width="6" x="58" y="36"></rect>
                          <rect height="6" width="6" x="68" y="36"></rect>
                          <rect height="6" width="6" x="12" y="48"></rect>
                          <rect height="6" width="6" x="24" y="48"></rect>
                          <rect height="6" width="6" x="36" y="48"></rect>
                          <rect fill="#8b001a" height="8" width="8" x="48" y="48"></rect>
                          <rect height="6" width="6" x="62" y="48"></rect>
                          <rect height="6" width="6" x="74" y="48"></rect>
                          <rect height="6" width="6" x="86" y="48"></rect>
                          <rect height="6" width="6" x="98" y="48"></rect>
                          <rect height="6" width="6" x="12" y="60"></rect>
                          <rect height="6" width="6" x="28" y="60"></rect>
                          <rect height="6" width="6" x="42" y="60"></rect>
                          <rect height="6" width="12" x="54" y="60"></rect>
                          <rect height="6" width="6" x="72" y="60"></rect>
                          <rect height="6" width="6" x="88" y="60"></rect>
                          <rect height="6" width="6" x="102" y="60"></rect>
                          <rect height="6" width="6" x="48" y="74"></rect>
                          <rect height="6" width="6" x="62" y="74"></rect>
                          <rect height="6" width="6" x="74" y="74"></rect>
                          <rect height="6" width="6" x="92" y="74"></rect>
                          <rect height="6" width="6" x="48" y="86"></rect>
                          <rect height="6" width="6" x="60" y="86"></rect>
                          <rect height="6" width="6" x="76" y="86"></rect>
                          <rect height="6" width="6" x="88" y="86"></rect>
                          <rect height="6" width="6" x="100" y="86"></rect>
                          {/* Mini TERRA Center Logo */}
                          <circle cx="60" cy="60" fill="#ffffff" r="11"></circle>
                          <circle cx="60" cy="60" fill="#8b001a" r="9"></circle>
                          <text fill="#ffffff" fontFamily="Plus Jakarta Sans" fontSize="8" fontWeight="bold" textAnchor="middle" x="60" y="63">
                            T
                          </text>
                        </svg>
                      </div>

                      <div className="mt-2 w-full">
                        <div className="flex items-center justify-between text-[11px] font-label-subtle text-label-subtle text-on-surface-variant">
                          <span>Monto Exacto:</span>
                          <strong className="text-on-surface text-[12px]">{formatBs(totalPagar)}</strong>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-label-subtle text-label-subtle text-primary font-bold mt-1">
                          <span>Expira en:</span>
                          <span>{tiempoQrTexto}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="w-full mt-3 py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high font-label-interactive text-label-interactive text-[12px] flex items-center justify-center gap-1 cursor-pointer"
                        onClick={() => alert('Descargando imagen QR oficial...')}
                      >
                        <span className="material-symbols-outlined text-[16px]">download</span> Descargar Imagen QR
                      </button>
                    </div>

                    {/* Instrucciones y Apps Bancarias */}
                    <div className="flex-1 space-y-space-md text-left">
                      <div>
                        <h4 className="font-title-sm text-title-sm text-on-surface font-semibold">
                          ¿Cómo pagar con QR Simple?
                        </h4>
                        <ol className="mt-2 space-y-2 font-body-sm text-body-sm text-on-surface-variant list-decimal list-inside">
                          <li>Abre tu aplicación bancaria móvil (BCP, BNB, Banco Unión, GanaMóvil, Mercantil, Bisa).</li>
                          <li>
                            Selecciona la opción de <strong>Cobro / Pago por QR</strong> y escanea el código presentado.
                          </li>
                          <li>
                            Verifica el monto total de <strong>{formatBs(totalPagar)}</strong> y destinatario{' '}
                            <strong>TERRA MUEBLES S.R.L.</strong>
                          </li>
                          <li>Confirma la operación en tu app. La pantalla se actualizará automáticamente en pocos segundos.</li>
                        </ol>
                      </div>

                      {/* Bancos Compatibles */}
                      <div className="bg-surface-container-lowest p-3 rounded-lg border border-surface-container">
                        <p className="font-label-subtle text-label-subtle text-on-surface font-bold mb-2">
                          Bancos y Billeteras Habilitadas en Bolivia:
                        </p>
                        <div className="flex flex-wrap items-center gap-2 font-label-subtle text-label-subtle text-on-surface-variant">
                          <span className="px-2 py-1 bg-surface-container rounded font-semibold text-on-surface">BCP Móvil</span>
                          <span className="px-2 py-1 bg-surface-container rounded font-semibold text-on-surface">BNB Móvil</span>
                          <span className="px-2 py-1 bg-surface-container rounded font-semibold text-on-surface">GanaMóvil</span>
                          <span className="px-2 py-1 bg-surface-container rounded font-semibold text-on-surface">Banco Unión</span>
                          <span className="px-2 py-1 bg-surface-container rounded font-semibold text-on-surface">Mercantil Santa Cruz</span>
                          <span className="px-2 py-1 bg-surface-container rounded font-semibold text-on-surface">Sol BCP</span>
                          <span className="px-2 py-1 bg-surface-container rounded font-semibold text-on-surface">Bisa Móvil</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 font-label-subtle text-label-subtle text-primary bg-primary/10 p-2.5 rounded-lg">
                        <span className="material-symbols-outlined text-[18px]">sync</span>
                        <span>Escucha en tiempo real activa: No cierres esta ventana mientras realizas la transferencia.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CONTENIDO 2: TARJETA DE CRÉDITO / DÉBITO */}
              {metodoPago === 'card' && (
                <div className="bg-surface-container-low rounded-xl p-space-lg space-y-space-md border border-surface-container">
                  <div className="flex items-center justify-between pb-2 border-b border-surface-container">
                    <span className="font-label-interactive text-label-interactive text-on-surface font-semibold">
                      Tarjetas nacionales e internacionales vía Red Enlace / Cybersource
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-label-subtle text-label-subtle bg-surface-container-lowest px-2 py-1 rounded font-bold">VISA</span>
                      <span className="font-label-subtle text-label-subtle bg-surface-container-lowest px-2 py-1 rounded font-bold">MASTERCARD</span>
                      <span className="font-label-subtle text-label-subtle bg-surface-container-lowest px-2 py-1 rounded font-bold">RED ENLACE</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                    <div className="sm:col-span-2">
                      <label className="block font-label-interactive text-label-interactive text-on-surface mb-1 font-semibold">
                        Número de Tarjeta
                      </label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[20px]">credit_card</span>
                        <input
                          type="text"
                          defaultValue="4000 1234 5678 9010"
                          className="w-full h-12 pl-10 pr-4 rounded-lg bg-surface-container-lowest text-on-surface font-mono font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-label-interactive text-label-interactive text-on-surface mb-1 font-semibold">
                        Nombre del Titular (como figura en la tarjeta)
                      </label>
                      <input
                        type="text"
                        defaultValue="RODRIGO AGUILERA M"
                        className="w-full h-12 px-4 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm uppercase"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-label-interactive text-label-interactive text-on-surface mb-1 font-semibold">
                          Vencimiento
                        </label>
                        <input
                          type="text"
                          defaultValue="08/28"
                          className="w-full h-12 px-3 text-center rounded-lg bg-surface-container-lowest text-on-surface font-mono font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block font-label-interactive text-label-interactive text-on-surface mb-1 font-semibold">
                          CVV / CVC
                        </label>
                        <input
                          type="password"
                          defaultValue="894"
                          maxLength={4}
                          className="w-full h-12 px-3 text-center rounded-lg bg-surface-container-lowest text-on-surface font-mono font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-on-surface-variant font-label-subtle text-label-subtle">
                    <span className="material-symbols-outlined text-[16px] text-primary">verified_user</span>
                    <span>Protegido con autenticación de dos factores 3D Secure / OTP SMS bancario.</span>
                  </div>
                </div>
              )}

              {/* CONTENIDO 3: PAGO EN CAJA SHOWROOM */}
              {metodoPago === 'caja' && (
                <div className="bg-surface-container-low rounded-xl p-space-lg space-y-space-md border border-surface-container">
                  <div className="flex items-start gap-space-md">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[28px]">payments</span>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-title-sm text-title-sm text-on-surface font-bold">
                        Paga directamente al retirar en {sucursalActiva?.nombreCompleto || 'Sucursal Central'}
                      </h4>
                      <p className="font-body-md text-body-md text-on-surface-variant">
                        Generaremos una orden reservada con vigencia de <strong>24 horas</strong>. Puedes abonar en ventanilla en efectivo (Bolivianos o Dólares al tipo de cambio oficial) o con tu tarjeta física en nuestro terminal POS.
                      </p>
                    </div>
                  </div>

                  <div className="bg-surface-container-lowest p-space-md rounded-xl space-y-2 border border-surface-container">
                    <div className="flex items-center justify-between text-on-surface font-body-sm text-body-sm">
                      <span>Ventanilla Asignada:</span>
                      <strong className="font-semibold">Caja 01 - Mostrador Autoservicio {sucursalActiva?.nombre || 'Central'}</strong>
                    </div>
                    <div className="flex items-center justify-between text-on-surface font-body-sm text-body-sm">
                      <span>Código de Reserva Generado:</span>
                      <strong className="font-mono text-primary font-bold">TERRA-SCZ-84920</strong>
                    </div>
                    <div className="flex items-center justify-between text-on-surface font-body-sm text-body-sm">
                      <span>Monto a cancelar en sala:</span>
                      <strong className="text-[16px] text-on-surface font-bold">{formatBs(totalPagar)}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* CONTENIDO 4: TRANSFERENCIA BANCARIA */}
              {metodoPago === 'transfer' && (
                <div className="bg-surface-container-low rounded-xl p-space-lg space-y-space-md border border-surface-container">
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Realiza la transferencia interbancaria ACH y envía tu comprobante adjunto o por WhatsApp oficial:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
                    <div className="bg-surface-container-lowest p-3 rounded-xl shadow-sm border border-surface-container">
                      <p className="font-label-subtle text-label-subtle text-primary font-bold">BANCO DE CRÉDITO DE BOLIVIA (BCP)</p>
                      <p className="font-label-interactive text-label-interactive text-on-surface mt-1 font-semibold">Cta Cte BOB: 201-5089301-3-18</p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">Titular: TERRA MUEBLES & COLCHONES S.R.L.</p>
                      <p className="font-label-subtle text-label-subtle text-on-surface-variant">NIT: 10293847012</p>
                    </div>
                    <div className="bg-surface-container-lowest p-3 rounded-xl shadow-sm border border-surface-container">
                      <p className="font-label-subtle text-label-subtle text-primary font-bold">BANCO GANADERO S.A.</p>
                      <p className="font-label-interactive text-label-interactive text-on-surface mt-1 font-semibold">Cta Cte BOB: 1052-49102-1</p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">Titular: TERRA MUEBLES & COLCHONES S.R.L.</p>
                      <p className="font-label-subtle text-label-subtle text-on-surface-variant">NIT: 10293847012</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ==================== RIGHT COLUMN: STICKY SUMMARY ==================== */}
          <div className="lg:col-span-5 xl:col-span-4 sticky top-48 space-y-space-md">
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-md space-y-space-md border border-surface-container">
              {/* Summary Header */}
              <div className="flex items-center justify-between pb-space-sm border-b border-surface-container">
                <div>
                  <h2 className="font-title-sm text-title-sm text-on-surface font-bold">Resumen de tu Pedido</h2>
                  <p className="font-label-subtle text-label-subtle text-on-surface-variant">
                    {totalArticulos} {totalArticulos === 1 ? 'artículo en carrito' : 'artículos en carrito autoservicio'}
                  </p>
                </div>
                <button
                  type="button"
                  className="font-label-subtle text-label-subtle text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  onClick={() => onNavegar('carrito')}
                >
                  <span className="material-symbols-outlined text-[14px]">edit</span> Editar
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-space-sm p-2 rounded-lg bg-surface-container-low/70">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface-container shrink-0 flex items-center justify-center p-1">
                      <img className="w-full h-full object-contain" src={item.src || item.imagen} alt={item.nombre} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-label-interactive text-label-interactive text-on-surface truncate font-bold text-[14px]">
                        {item.nombre}
                      </h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant text-[12px]">
                        {item.categoria || 'Mueblería TERRA'}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-label-subtle text-label-subtle text-on-surface-variant text-[12px]">
                          Cant: {item.cantidad}
                        </span>
                        <span className="font-label-interactive text-label-interactive text-on-surface font-bold text-[14px]">
                          {formatBs(item.precio * item.cantidad)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cupón Aplicado */}
              <div className="bg-primary/5 p-3 rounded-lg flex items-center justify-between text-[13px] border border-primary/10">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">sell</span>
                  <div>
                    <p className="font-label-interactive text-label-interactive text-primary font-bold">TERRASCZ2025</p>
                    <p className="font-label-subtle text-label-subtle text-on-surface-variant text-[11px]">
                      Descuento Kiosco Autoservicio
                    </p>
                  </div>
                </div>
                <span className="font-label-interactive text-label-interactive text-primary font-bold">
                  -{formatBs(descuentoPromocion)}
                </span>
              </div>

              {/* Financial Breakdown */}
              <div className="space-y-2 pt-space-xs font-body-sm text-body-sm text-on-surface-variant">
                <div className="flex justify-between">
                  <span>Subtotal Productos</span>
                  <span className="font-semibold text-on-surface">{formatBs(subtotalProductos)}</span>
                </div>
                <div className="flex justify-between text-primary">
                  <span>Descuento Promoción</span>
                  <span className="font-semibold">-{formatBs(descuentoPromocion)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    <span>{modalidadEntrega === 'retiro' ? `Retiro en ${sucursalActiva?.nombre || 'Central'}` : 'Envío a Domicilio'}</span>
                    <span className="material-symbols-outlined text-[14px] text-primary">check_circle</span>
                  </span>
                  <span className={`font-semibold uppercase ${modalidadEntrega === 'retiro' ? 'text-primary' : 'text-on-surface'}`}>
                    {modalidadEntrega === 'retiro' ? 'Sin costo' : 'Con comisión'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Armado e Inspección Técnica</span>
                  <span className="font-semibold text-primary uppercase">Incluido</span>
                </div>
                <div className="flex justify-between text-[11px] text-on-surface-variant">
                  <span>Impuesto de Ley (IVA 13% incluido)</span>
                  <span>Incluido en factura</span>
                </div>

                {/* Total Divider */}
                <div className="pt-space-sm my-space-sm bg-surface-container-high h-[1px]"></div>
                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="block font-title-sm text-title-sm text-on-surface font-bold">Total a Pagar</span>
                    <span className="font-label-subtle text-label-subtle text-on-surface-variant">
                      Moneda oficial Bolivianos (BOB)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block font-headline-lg text-headline-lg text-primary font-bold leading-none">
                      {formatBs(totalPagar)}
                    </span>
                    <span className="font-label-subtle text-label-subtle text-on-surface-variant text-[11px]">
                      Con Factura Legal SIN
                    </span>
                  </div>
                </div>
              </div>

              {/* PRIMARY HERO CTA BUTTON */}
              <button
                type="button"
                className="w-full h-14 rounded-full bg-primary hover:bg-primary-container text-on-primary font-label-interactive text-label-interactive text-[16px] font-bold flex items-center justify-center gap-3 transition-all shadow-[0_10px_28px_-6px_rgba(179,19,41,0.42)] cursor-pointer group active:scale-[0.99]"
                onClick={() => {
                  if (onFinalizarCompra) {
                    onFinalizarCompra({
                      metodoPago,
                      totalPagar,
                      modalidadEntrega,
                      sucursal: sucursalSeleccionada,
                      cliente: perfilCliente,
                    });
                  } else {
                    alert(`¡Pago completado con éxito mediante ${metodoPago.toUpperCase()}! Generando ticket de confirmación...`);
                  }
                }}
              >
                <span>Confirmar y Pagar {formatBs(totalPagar)}</span>
                <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </span>
              </button>

              {/* Términos */}
              <p className="font-label-subtle text-label-subtle text-center text-on-surface-variant text-[11px] leading-tight">
                Al presionar Confirmar aceptas los <a className="text-primary underline" href="#">Términos de Autoservicio</a> y la <a className="text-primary underline" href="#">Garantía Oficial de Muebles TERRA</a>.
              </p>

              {/* Micro-Garantías */}
              <div className="space-y-2 pt-space-sm bg-surface-container-low p-space-md rounded-xl">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-primary text-[20px]">security</span>
                  <p className="font-body-sm text-body-sm text-on-surface">
                    <strong className="font-semibold">Transacción 100% Cifrada:</strong> Estándar bancario SSL 256-bit y Tokenización.
                  </p>
                </div>
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-primary text-[20px]">award_star</span>
                  <p className="font-body-sm text-body-sm text-on-surface">
                    <strong className="font-semibold">Garantía TERRA:</strong> 1 año en estructuras de madera y resortes.
                  </p>
                </div>
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-primary text-[20px]">headset_mic</span>
                  <p className="font-body-sm text-body-sm text-on-surface">
                    <strong className="font-semibold">Soporte en Santa Cruz:</strong> Sucursal {sucursalActiva?.nombre || 'Central'} (3) 344-5500.
                  </p>
                </div>
              </div>
            </div>

            {/* Banner de ayuda en sala */}
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between border border-surface-container">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">support_agent</span>
                </div>
                <div>
                  <p className="font-label-interactive text-label-interactive text-on-surface font-semibold">
                    ¿Necesitas ayuda con el pago?
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant text-[12px]">
                    Llama al anfitrión de Autoservicio en sala.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="px-3.5 py-1.5 rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high font-label-interactive text-label-interactive text-[12px] cursor-pointer"
                onClick={() => alert('Anfitrión notificado. Un asesor se acercará a tu terminal.')}
              >
                Llamar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating WhatsApp Action for Showroom */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 pointer-events-auto">
        <a
          className="flex items-center gap-2 bg-surface-container-lowest text-on-surface px-4 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all border border-surface-container"
          href="https://wa.me/59177089421"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
          <span className="font-label-interactive text-label-interactive text-[13px] font-semibold">
            WhatsApp Sucursal {sucursalActiva?.nombre || 'Central'}
          </span>
          <span className="material-symbols-outlined text-[20px] text-primary">chat</span>
        </a>
      </div>
    </div>
  );
}
