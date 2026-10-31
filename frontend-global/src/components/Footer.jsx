import { LOGO_TERRA } from '../data/sucursalesData.js';

export default function Footer({ onNavegarASucursales }) {
  const manejarClickSalas = (e) => {
    e.preventDefault();
    if (onNavegarASucursales) {
      onNavegarASucursales();
    } else {
      const seccion = document.getElementById('sucursales-section');
      if (seccion) {
        seccion.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="w-full bg-surface-container-low text-on-surface pt-space-2xl pb-space-lg shadow-[0_-4px_24px_rgba(0,0,0,0.03)]">
      <div className="w-full px-margin">
        {/* Top 3 Trust Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md mb-space-2xl bg-surface-container-lowest p-space-lg rounded-xl shadow-[0_4px_12px_-2px_rgba(30,20,15,0.04)]">
          <div className="flex items-center gap-space-md">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[24px]">touch_app</span>
            </div>
            <div>
              <p className="font-title-sm text-title-sm text-on-surface font-semibold">Pedido en Línea &amp; Autoservicio</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Configura en línea y retira en cualquier showroom o recibe a domicilio.</p>
            </div>
          </div>

          <div className="flex items-center gap-space-md">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[24px]">workspace_premium</span>
            </div>
            <div>
              <p className="font-title-sm text-title-sm text-on-surface font-semibold">Garantía Oficial Terra</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Hasta 10 años de respaldo en resortes, maderas tratadas y tapices premium.</p>
            </div>
          </div>

          <div className="flex items-center gap-space-md">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[24px]">payments</span>
            </div>
            <div>
              <p className="font-title-sm text-title-sm text-on-surface font-semibold">Pago Seguro en Caja &amp; QR</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Paga con QR Simple, tarjeta en showroom o financiamiento directo.</p>
            </div>
          </div>
        </div>

        {/* 3 Columns Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl mb-space-xl">
          {/* Column 1: Brand & Schedule */}
          <div className="lg:col-span-4">
            <div className="mb-space-sm flex items-center gap-3">
              <img
                alt="TERRA Muebles &amp; Colchones"
                className="h-12 w-auto object-contain"
                src={LOGO_TERRA}
              />
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant mb-space-md">
              Experiencia omnicanal de descanso y equipamiento para el hogar en Santa Cruz de la Sierra. Visita nuestras salas interactivas o compra con autoservicio digital asistido.
            </p>
            <div className="flex items-center gap-space-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-primary text-[20px]">schedule</span>
              <div className="font-body-sm text-body-sm">
                <span className="text-on-surface font-semibold">Horario Continuado:</span> Lun a Sáb 09:00 - 21:00 | Dom 11:00 - 19:00
              </div>
            </div>
          </div>

          {/* Column 2: 5 Showrooms in Santa Cruz */}
          <div className="lg:col-span-5">
            <p className="font-title-sm text-title-sm font-semibold text-on-surface mb-space-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">map</span>
              Nuestras 5 Salas en Santa Cruz
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm font-body-sm text-body-sm">
              <div className="bg-surface-container-lowest p-space-sm rounded-lg">
                <p className="font-semibold text-on-surface text-[14px]">Sucursal Equipetrol (Flagship)</p>
                <p className="text-on-surface-variant text-[12px]">Av. San Martín esq. Calle 7 Oeste</p>
                <span className="inline-block mt-1 font-label-subtle text-label-subtle text-primary">Stock en Sala: Disponible</span>
              </div>
              <div className="bg-surface-container-lowest p-space-sm rounded-lg">
                <p className="font-semibold text-on-surface text-[14px]">Ventura Mall</p>
                <p className="text-on-surface-variant text-[12px]">Nivel 2, Frente a patio de diseño</p>
                <span className="inline-block mt-1 font-label-subtle text-label-subtle text-primary">Stock en Sala: Disponible</span>
              </div>
              <div className="bg-surface-container-lowest p-space-sm rounded-lg">
                <p className="font-semibold text-on-surface text-[14px]">Las Brisas Shopping</p>
                <p className="text-on-surface-variant text-[12px]">4to Anillo y Av. Cristo Redentor</p>
                <span className="inline-block mt-1 font-label-subtle text-label-subtle text-primary">Stock en Sala: Disponible</span>
              </div>
              <div className="bg-surface-container-lowest p-space-sm rounded-lg">
                <p className="font-semibold text-on-surface text-[14px]">Showroom Radial 19</p>
                <p className="text-on-surface-variant text-[12px]">Radial 19 entre 3er y 4to Anillo</p>
                <span className="inline-block mt-1 font-label-subtle text-label-subtle text-primary">Centro Logístico de Entrega</span>
              </div>
              <div className="bg-surface-container-lowest p-space-sm rounded-lg sm:col-span-2">
                <p className="font-semibold text-on-surface text-[14px]">Showroom Santos Dumont</p>
                <p className="text-on-surface-variant text-[12px]">Av. Santos Dumont esq. 3er Anillo Interno</p>
                <span className="inline-block mt-1 font-label-subtle text-label-subtle text-primary">Outlet &amp; Ofertas de Exposición</span>
              </div>
            </div>
          </div>

          {/* Column 3: Support & Contact */}
          <div className="lg:col-span-3">
            <p className="font-title-sm text-title-sm font-semibold text-on-surface mb-space-sm">Asistencia &amp; Contacto</p>
            <div className="space-y-space-sm font-body-sm text-body-sm text-on-surface-variant">
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">support_agent</span>
                Central Telefónica: +591 (3) 344-5500
              </p>
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">mail</span>
                atencion@terramuebles.com.bo
              </p>
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">local_shipping</span>
                Despachos en Gran Santa Cruz (Warnes, Montero, Cotoca, La Guardia)
              </p>
              <div className="mt-space-md pt-space-sm">
                <a
                  className="inline-flex items-center gap-2 bg-secondary-container hover:bg-surface-container-high hover:text-on-surface text-on-secondary-container px-space-md py-2 rounded-full font-label-interactive text-label-interactive transition-colors cursor-pointer"
                  href="#sucursales-section"
                  onClick={manejarClickSalas}
                >
                  <span className="material-symbols-outlined text-[18px]">pin_drop</span>
                  Ver Mapa Interactivo de Salas
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legal / Copyright */}
        <div className="pt-space-md flex flex-col md:flex-row items-center justify-between text-on-surface-variant font-label-subtle text-label-subtle gap-space-sm">
          <p>© 2025 TERRA Muebles &amp; Colchones S.R.L. Santa Cruz de la Sierra, Bolivia. Todos los derechos reservados.</p>
          <div className="flex items-center gap-space-md">
            <a className="hover:text-on-surface transition-colors" href="#">Términos de Autoservicio</a>
            <a className="hover:text-on-surface transition-colors" href="#">Políticas de Garantía y Devolución</a>
            <a className="hover:text-on-surface transition-colors" href="#">Aviso Legal</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
