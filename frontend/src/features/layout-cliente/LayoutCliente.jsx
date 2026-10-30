import { useContext, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useCarrito } from '../../hooks/useCarrito.js';
import { SesionClienteContext } from '../../context/SesionClienteContext.jsx';
import { useTutorial } from '../../context/TutorialContext.jsx';
import { MODO_DEMO, WHATSAPP_COMPROBANTES } from '../../services/api.js';
import { useNavegacion } from '../../navegacion/NavegacionContext.jsx';
import ChatAsistente from '../../components/chat/ChatAsistente.jsx';
import CarritoFlotante from '../carrito/components/CarritoFlotante.jsx';
import WebAccountModal from '../../components/WebAccountModal.jsx';
import LectorVoz from '../../components/accesibilidad/LectorVoz.jsx';
import SaltarContenido from '../../accesibilidad/SaltarContenido.jsx';
import BotonAccesibilidad from '../../accesibilidad/BotonAccesibilidad.jsx';
import VigilanteInactividad from '../../accesibilidad/VigilanteInactividad.jsx';
import EncabezadoCliente from './components/EncabezadoCliente.jsx';
import NavegacionInferior from './components/NavegacionInferior.jsx';
import PieCliente from './components/PieCliente.jsx';
import BotonQrFlotante from './components/BotonQrFlotante.jsx';

// En Carrito y Confirmación, por debajo de 761 px el resumen es una hoja fija abajo
// (HojaInferior): los flotantes y el botón de accesibilidad arrancan por encima.
const FLOTANTES_SOBRE_RESUMEN =
  `con-resumen-fijo:[--terra-flotante-abajo:calc(var(--terra-hoja-abajo)+var(--spacing-terra-hoja)+0.75rem)]
  con-resumen-fijo:[--terra-a11y-abajo:var(--terra-flotante-abajo)]`;

// Contenedor de la tienda: encabezado, contenido, barra inferior en teléfono, pie y
// botones flotantes. app-shell y page-content: ganchos de hojas que todavía no se
// migraron (accesibilidad y mayorista).
export default function LayoutCliente() {
  const { cantidadTotal } = useCarrito();
  const { sesion, esMayorista, cerrarSesion } = useContext(SesionClienteContext);
  // El modal de login mayorista lo controla NavegacionContext (voz, chat y ?login=1 lo abren).
  const { loginMayoristaAbierto: cuentaAbierta, abrirLoginMayorista, cerrarLoginMayorista } = useNavegacion();
  const { solicitarTutorial } = useTutorial();
  const [menuCuentaAbierto, setMenuCuentaAbierto] = useState(false);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const pulsacionesLogo = useRef([]);

  useEffect(() => {
    setMenuMovilAbierto(false);
    if (location.state?.catalogo?.posicionScroll) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname, location.state]);

  const abrirAdminConLogo = (event) => {
    const ahora = Date.now();
    pulsacionesLogo.current = [...pulsacionesLogo.current, ahora].filter((marca) => ahora - marca < 2500);
    if (pulsacionesLogo.current.length < 5) return;
    event.preventDefault();
    pulsacionesLogo.current = [];
    navigate('/admin/login');
  };

  const cerrarCuenta = () => {
    cerrarSesion();
    setMenuCuentaAbierto(false);
    navigate('/');
  };
  const abrirTutorial = () => {
    setMenuMovilAbierto(false);
    if (location.pathname !== '/catalogo') navigate('/catalogo');
    solicitarTutorial();
  };
  const tocarBotonCuenta = () => {
    setMenuMovilAbierto(false);
    return esMayorista ? setMenuCuentaAbierto((abierto) => !abierto) : abrirLoginMayorista();
  };
  const inicialesCuenta = String(sesion?.nombre || 'M').split(' ').filter(Boolean).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase();
  const enlaceAsesor = `https://wa.me/${WHATSAPP_COMPROBANTES}?text=${encodeURIComponent('Hola, necesito asesoramiento sobre mi cuenta mayorista TERRA.')}`;
  const enCarrito = location.pathname === '/carrito';
  const enConfirmacion = location.pathname === '/confirmacion';

  return (
    <div
      className={`app-shell flex min-h-screen flex-col bg-terra-fondo bg-[url('/images/inicio/fondo.webp')]
        bg-cover bg-fixed bg-center bg-no-repeat font-terra text-terra-texto dark:bg-none
        ${enCarrito || enConfirmacion ? FLOTANTES_SOBRE_RESUMEN : ''}`}
    >
      <SaltarContenido />
      <LectorVoz />
      <BotonAccesibilidad />
      <VigilanteInactividad />
      <EncabezadoCliente
        menuAbierto={menuMovilAbierto}
        onAlternarMenu={() => setMenuMovilAbierto((abierto) => !abierto)}
        onLogo={abrirAdminConLogo}
        onTutorial={abrirTutorial}
        cantidadCarrito={cantidadTotal}
        cuenta={{
          sesion,
          esMayorista,
          iniciales: inicialesCuenta,
          enlaceAsesor,
          menuAbierto: menuCuentaAbierto,
          loginAbierto: cuentaAbierta,
          onBoton: tocarBotonCuenta,
          onElegir: () => setMenuCuentaAbierto(false),
          onCerrarSesion: cerrarCuenta,
        }}
      />
      {cuentaAbierta && <WebAccountModal onClose={() => cerrarLoginMayorista()} />}

      {MODO_DEMO && (
        <div
          className="border-b border-terra-aviso-texto/30 bg-terra-aviso-fondo px-4 py-1.5 text-center text-xs font-extrabold
            text-terra-aviso-texto"
        >
          MODO DEMOSTRACIÓN: precios y pedidos simulados para exhibición showroom.
        </div>
      )}

      <main
        className="page-content mx-auto w-full max-w-320 flex-1 px-4 py-3 sm:p-4 lg:px-4 lg:py-5
          xl:px-[clamp(1rem,2.5vw,2rem)] xl:py-6 max-md:has-[>[data-pagina=catalogo]]:p-0 print:p-0"
        id="contenido"
        tabIndex={-1}
      >
        <Outlet />
      </main>

      <NavegacionInferior cantidadCarrito={cantidadTotal} />
      <PieCliente enCarrito={enCarrito} />

      <CarritoFlotante />
      <ChatAsistente />
      <BotonQrFlotante onClick={() => navigate(`/catalogo?abrirQr=1&t=${Date.now()}`)} />
    </div>
  );
}
