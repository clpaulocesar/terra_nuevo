import { LOGO_TERRA } from '../data/sucursalesData.js';

export default function Footer({ onNavegarASucursales }) {
  return (
    <footer className="w-full bg-surface-container-low text-on-surface pt-space-2xl pb-space-lg shadow-[0_-4px_24px_rgba(0,0,0,0.03)]">
      <div className="w-full px-margin">
        {/* Top 3 Trust Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md mb-space-2xl bg-surface-container-lowest p-space-lg rounded-xl shadow-[0_4px_12px_-2px_rgba(30,20,15,0.04)]">
          <div className="flex items-center gap-space-md">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">touch_app</span>
            </div>
            <div>
              <p className="font-title-sm text-title-sm text-on-surface font-semibold">Pedido en Línea &amp; Autoservicio</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Configura en línea y retira en cualquier showroom o recibe a domicilio.</p>
            </div>
          </div>
          <div className="flex items-center gap-space-md">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">workspace_premium</span>
            </div>
            <div>
              <p className="font-title-sm text-title-sm text-on-surface font-semibold">Garantía Oficial Terra</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">1 año de respaldo oficial en resortes y maderas tratadas.</p>
            </div>
          </div>
          <div className="flex items-center gap-space-md">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">payments</span>
            </div>
            <div>
              <p className="font-title-sm text-title-sm text-on-surface font-semibold">Pago Seguro en Caja &amp; QR</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Paga con QR Simple, tarjeta en showroom o financiamiento directo.</p>
            </div>
          </div>
        </div>

        {/* Links & Showrooms Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl mb-space-xl">
          <div className="lg:col-span-4">
            <div className="mb-space-sm flex items-center gap-3">
              <img alt="TERRA Muebles &amp; Colchones" className="h-12 w-auto object-contain" src={LOGO_TERRA} />
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant mb-space-md">
              Experiencia omnicanal de descanso y equipamiento para el hogar en Santa Cruz de la Sierra. Visita nuestras salas
              interactivas o compra con autoservicio digital asistido.
            </p>
            <div className="flex items-center gap-space-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-primary text-[20px]">schedule</span>
              <div className="font-body-sm text-body-sm">
                <span className="text-on-surface font-semibold">Horario Continuado:</span> Lun a Sáb 09:00 - 21:00 | Dom 11:00 - 19:00
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <p className="font-title-sm text-title-sm font-semibold text-on-surface mb-space-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">map</span>Nuestras 3 Sucursales Oficiales en Santa Cruz
            </p>
            <div className="grid grid-cols-1 gap-space-sm font-body-sm text-body-sm">
              <div className="bg-surface-container-lowest p-space-sm rounded-lg border border-surface-container-low">
                <div className="flex items-start justify-between">
                  <a
                    href="https://www.google.com/search?kgmid=%2Fg%2F11c2kk62hb"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-primary hover:underline text-[14px] flex items-center gap-1"
                  >
                    1. Sucursal Central (Barrio Lindo) <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </a>
                  <span className="inline-block font-label-subtle text-label-subtle text-tertiary font-bold">Casa Matriz</span>
                </div>
                <p className="text-on-surface-variant text-[12px] mt-0.5">
                  Av. Carmelo Ortiz #3795, entre 3er y 4to anillo (Zona Nueva Feria Barrio Lindo, paralela a las rieles del tren)
                </p>
                <p className="text-[11px] text-on-surface mt-1 font-medium">Lun a Sáb: 08:00 - 20:00 | Dom: 09:00 - 15:00</p>
              </div>

              <div className="bg-surface-container-lowest p-space-sm rounded-lg border border-surface-container-low">
                <div className="flex items-start justify-between">
                  <p className="font-semibold text-on-surface text-[14px]">2. Sucursal Norte (SEARPI)</p>
                  <span className="inline-block font-label-subtle text-label-subtle text-primary font-bold">Zona Norte</span>
                </div>
                <p className="text-on-surface-variant text-[12px] mt-0.5">
                  4to Anillo, entre Av. Alemana y Av. 2 de Agosto (Frente al SEARPI / Banco de Sangre)
                </p>
                <p className="text-[11px] text-on-surface mt-1 font-medium">Lun a Sáb: 08:00 - 20:00 | Dom: 09:00 - 15:00</p>
              </div>

              <div className="bg-surface-container-lowest p-space-sm rounded-lg border border-surface-container-low">
                <div className="flex items-start justify-between">
                  <a
                    href="https://www.google.com/search?kgmid=%2Fg%2F11qqrr9_31"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-primary hover:underline text-[14px] flex items-center gap-1"
                  >
                    3. Sucursal Sur (Radial 10) <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </a>
                  <span className="inline-block font-label-subtle text-label-subtle text-primary font-bold">Zona Sur</span>
                </div>
                <p className="text-on-surface-variant text-[12px] mt-0.5">
                  4to Anillo, entre Radial 10 y Av. San Aurelio
                </p>
                <p className="text-[11px] text-on-surface mt-1 font-medium">Lun a Sáb: 08:00 - 20:00 | Dom: 09:00 - 15:00</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <p className="font-title-sm text-title-sm font-semibold text-on-surface mb-space-sm">Asistencia &amp; Contacto</p>
            <div className="space-y-space-sm font-body-sm text-body-sm text-on-surface-variant">
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">support_agent</span>Central Telefónica: +591 75335697
              </p>
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">mail</span>atencion@terramuebles.com.bo
              </p>
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">local_shipping</span>Despachos en Gran Santa Cruz (Warnes, Montero, Cotoca, La Guardia)
              </p>
              <div className="mt-space-md pt-space-sm">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 bg-secondary-container hover:bg-surface-container-high hover:text-on-surface text-on-secondary-container px-space-md py-2 rounded-full font-label-interactive text-label-interactive transition-colors cursor-pointer"
                  onClick={onNavegarASucursales}
                >
                  <span className="material-symbols-outlined text-[18px]">pin_drop</span>Ver Mapa Interactivo de Salas
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-space-md flex flex-col md:flex-row items-center justify-between text-on-surface-variant font-label-subtle text-label-subtle gap-space-sm border-t border-surface-container">
          <p>© 2025 TERRA Muebles &amp; Colchones S.R.L. Santa Cruz de la Sierra, Bolivia. Todos los derechos reservados.</p>
          <div className="flex items-center gap-space-md">
            <a className="hover:text-on-surface transition-colors" href="#terminos" onClick={(e) => { e.preventDefault(); alert('Términos de Autoservicio TERRA'); }}>
              Términos de Autoservicio
            </a>
            <a className="hover:text-on-surface transition-colors" href="#garantia" onClick={(e) => { e.preventDefault(); alert('Políticas de Garantía oficial'); }}>
              Políticas de Garantía y Devolución
            </a>
            <a className="hover:text-on-surface transition-colors" href="#aviso" onClick={(e) => { e.preventDefault(); alert('Aviso Legal TERRA SRL'); }}>
              Aviso Legal
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
