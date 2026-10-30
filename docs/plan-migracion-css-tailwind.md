# Plan de Migración de CSS a Tailwind v4 por Fases (Archivo por Archivo)

- **Fecha:** 2026-10-30  
- **Alcance:** `frontend/` (React 19 + Tailwind v4)  
- **Restricción obligatoria:** **NO TOCAR `src/index.css`** (se mantiene intacto con sus tokens y variantes actuales).  
- **Metodología:** Cada archivo `.css` representa una fase independiente y atómica.

---

## 1. Principios y Protocolo de Migración por Fase

Para cada archivo `.css` a migrar se ejecutará el siguiente ciclo estricto:

1. **Inspección del CSS y Componentes Asociados**:
   - Identificar qué componente(s) importan la hoja de estilo.
   - Extraer todas las clases, pseudoclases (`:hover`, `:focus`), estados y media queries responsive.
2. **Traducción a Tailwind v4 en el JSX**:
   - Reemplazar las clases CSS por clases de utilidad de Tailwind en el marcado JSX.
   - Usar estrictamente los tokens del sistema ya existentes en `index.css`: `bg-terra-primario`, `text-terra-texto`, `border-terra-borde`, `rounded-terra-tarjeta`, `font-terra`, etc.
   - Sin colores arbitrarios sueltos (evitar `bg-[#a6192e]`).
   - Respetar diseño mobile-first (`base` -> `xs:` -> `sm:` -> `md:` -> `lg:` -> `xl:`).
3. **Eliminación del Archivo `.css` y su Import**:
   - Remover el `import './Archivo.css';` del componente.
   - Eliminar físicamente el archivo `.css` (evita que reglas viejas fuera de capas compitan en la cascada).
4. **Validación de Calidad Obligatoria**:
   - `npm run lint` (sin errores ni advertencias en los archivos tocados).
   - `npm test` (pruebas unitarias y de accesibilidad en verde).
   - `npm run build` (compilación limpia del bundle Vite).
   - Comprobación visual en claro, oscuro y accesible (150 % zoom).

---

## 2. Mapa Completo de Fases (Archivo por Archivo)

### Bloque A: Portada y Navegación del Cliente (Fase 4 del Roadmap)

#### **Fase 1: `src/pages/Bienvenida.css` (+ `BienvenidaFeaturedHidden.css`)**
- **Componente asociado:** [`src/pages/Bienvenida.jsx`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/Bienvenida.jsx)
- **Objetivo:** Migrar todo el marcado de la portada a Tailwind v4 nativo.
  - El hero y el contenedor se dimensionan con `min-h-[calc(100dvh-4.25rem)] flex flex-col justify-between`.
  - Resuelve de raíz el requerimiento del pliegue: el componente llena el 100 % del viewport en desktop/kiosco y empuja el pie de página exactamente debajo de la primera pantalla sin eliminarlo.
  - Se eliminan `Bienvenida.css` y `BienvenidaFeaturedHidden.css`.

#### **Fase 2: `src/pages/Categorias.css`** ✅ (Completada 2026-10-30)
- **Componentes asociados:** [`src/pages/Categorias.jsx`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/Categorias.jsx) y [`src/components/ui/SelectorCategorias.jsx`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/components/ui/SelectorCategorias.jsx).
- **Acciones realizadas:**
  - Migración del hero, cuadrícula top 10 y franja de ofertas en `Categorias.jsx` a utilidades Tailwind v4 y tokens `@theme inline`.
  - Migración de `SelectorCategorias.jsx` (control desplegable, menú flotante y buscador) a Tailwind v4 y reemplazo de iconos a `IconoMaterial`.
  - Eliminación física de `src/pages/Categorias.css` y de su import. Reducción de ~7.8 kB en el CSS compilado.

#### **Fase 3: `src/routes/ClienteTheme.css`** ✅ (Completada 2026-10-30)
- **Componentes asociados:** [`src/routes/AppRoutes.jsx`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/routes/AppRoutes.jsx) y limpieza en [`src/theme-dark.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/theme-dark.css).
- **Acciones realizadas:**
  - Retiro del `import './ClienteTheme.css';` en `AppRoutes.jsx`.
  - Depuración de selectores muertos en `theme-dark.css` (reglas antiguas de Bienvenida, Categorías y acentos de `ClienteTheme.css`).
  - Eliminación física de `src/routes/ClienteTheme.css`. Con esto queda finalizado el **Bloque A (Portada y Navegación del Cliente)**.

---

### Bloque B: Componentes UI y Flotantes

#### **Fase 4: `src/components/WebAccountModal.css`** ✅ (Completada 2026-10-30)
- **Componente asociado:** [`src/components/WebAccountModal.jsx`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/components/WebAccountModal.jsx).
- **Acciones realizadas:**
  - Migración completa del diálogo modal, formulario de inicio de sesión mayorista, inputs con iconos, botón de visibilidad de contraseña, recordatorio y botón de WhatsApp a utilidades de Tailwind v4 y tokens `@theme`.
  - Formateo legible del componente conforme a las reglas de estilo de `AGENTS.md` (una sentencia por línea, indentación limpia).
  - Eliminación de reglas residuales en `theme-dark.css`.
  - Eliminación física de `src/components/WebAccountModal.css`.

#### **Fase 5: `src/components/ui/BotonTema.css`** ✅ (Completada 2026-10-30)
- **Componente asociado:** [`src/components/ui/BotonTema.jsx`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/components/ui/BotonTema.jsx).
- **Acciones realizadas:**
  - Migración a utilidades de Tailwind v4 y tokens `@theme` (`bg-terra-control`, `text-terra-texto-control`, `border-terra-borde-control`, etc.), compatibles de forma automática con modo claro y noche sin reglas de tema extra.
  - Micro-animación en hover (rotación suave del icono `group-hover:rotate-[20deg]` con `motion-reduce:transform-none`).
  - Eliminación física de `src/components/ui/BotonTema.css`.

#### **Fase 6: `src/components/chat/ChatAsistente.css`** ✅ (Completada 2026-10-30)
- **Componentes asociados:** [`src/components/chat/ChatAsistente.jsx`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/components/chat/ChatAsistente.jsx) y [`src/components/chat/MensajeMarkdown.jsx`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/components/chat/MensajeMarkdown.jsx).
- **Acciones realizadas:**
  - Migración completa del widget flotante del chatbot de n8n a utilidades Tailwind v4 (panel de conversación responsivo, cabecera con botón de cierre, historial de mensajes con auto-scroll, burbujas por rol: asistente, usuario, error, escribiendo).
  - Estilos integrados para notas de voz (reproductor de audio, estado de grabación con punto pulsante accesible y contador).
  - Conservación de clases hook requeridas por la variante global (`chat-widget` y `abierto` para `@custom-variant con-asistente-abierto` en `index.css`).
  - Purga de reglas obsoletas `.chat-*` en `src/theme-dark.css`.
  - Eliminación física de `src/components/chat/ChatAsistente.css`.

#### **Fase 7: `src/components/ui/TecladoTactil.css`** ✅ (Completada 2026-10-30)
- **Componente asociado:** [`src/components/ui/TecladoTactil.jsx`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/components/ui/TecladoTactil.jsx).
- **Acciones realizadas:**
  - Migración integral a Tailwind v4 manteniendo la clase gancho `.tt-board` en el contenedor raíz para preservar la regla de accesibilidad en `accesibilidad.css`.
  - Reemplazo de spans `material-symbols-outlined` por el componente oficial [`IconoMaterial.jsx`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/components/ui/IconoMaterial.jsx).
  - Popover de vista previa flotante de tecla presionado reescrito con clases Tailwind nativas sin pseudoelementos manuales ni animaciones complejas en CSS.
  - Eliminación física de `src/components/ui/TecladoTactil.css`.

#### **Fase 8: `src/tutorial/tutorial.css`** ✅ (Completada 2026-10-30)
- **Componentes asociados:** [`src/tutorial/BotonTutorial.jsx`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/tutorial/BotonTutorial.jsx), [`src/tutorial/TutorialInvitacion.jsx`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/tutorial/TutorialInvitacion.jsx) y estilos para `driver.js`.
- **Acciones realizadas:**
  - Migración de `BotonTutorial` y del modal `TutorialInvitacion` a Tailwind v4 puro con micro-animaciones y tokens `@theme`.
  - Depuración de `tutorial.css` conservando única y exclusivamente las reglas requeridas para estilizar los popovers dinámicos de la librería externa `driver.js`, enlazadas a tokens semánticos `var(--terra-*)`.

#### **Fase 9: `src/styles/alertas.css`** ✅ (Completada 2026-10-30)
- **Componente asociado:** Diálogos SweetAlert2 globales vía [`src/utils/alertas.js`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/utils/alertas.js).
- **Acciones realizadas:**
  - Conversión de `alertas.css` a variables CSS semánticas (`--terra-superficie`, `--terra-borde`, `--terra-texto`, `--terra-primario`, `--terra-control`), eliminando colores fijos hexadecimales.
  - Purga de reglas heredadas y con `!important` en `src/theme-dark.css`.

---

### Bloque C: Portal B2B Mayorista (Fase 5 del Roadmap)

#### **Fase 10: `src/pages/InicioMayorista.css`**
- **Componente asociado:** [`src/pages/InicioMayorista.jsx`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/InicioMayorista.jsx)
- **Objetivo:** Catálogo B2B, tarjetas de producto con escala de precios y resumen de pedido lateral.

#### **Fase 11: `src/pages/PanelMayorista.css`**
- **Componente asociado:** [`src/pages/PanelMayorista.jsx`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/PanelMayorista.jsx)
- **Objetivo:** Panel de cuenta mayorista, tarjetas de información fiscal y formularios de contacto.

#### **Fase 12: `src/pages/PedidosMayorista.css`**
- **Componente asociado:** [`src/pages/PedidosMayorista.jsx`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/PedidosMayorista.jsx)
- **Objetivo:** Tablas y tarjetas de historial de pedidos por mayor.

---

### Bloque D: Módulo de Vendedor y Caja

#### **Fase 13: `src/pages/vendedor/LoginVendedor.css`**
- **Componente asociado:** [`src/pages/vendedor/LoginVendedor.jsx`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/vendedor/LoginVendedor.jsx)

#### **Fase 14: `src/components/vendedor/VendedorLayout.css`**
- **Componente asociado:** [`src/components/vendedor/VendedorLayout.jsx`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/components/vendedor/VendedorLayout.jsx)

#### **Fase 15: `src/pages/vendedor/DashboardVendedor.css`**
- **Componente asociado:** [`src/pages/vendedor/DashboardVendedor.jsx`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/vendedor/DashboardVendedor.jsx)

#### **Fase 16: `src/components/vendedor/ReportePedidosVendedor.css`**
- **Componente asociado:** [`src/components/vendedor/ReportePedidosVendedor.jsx`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/components/vendedor/ReportePedidosVendedor.jsx)

---

### Bloque E: Módulo Administrativo / Backoffice (Fase 6 del Roadmap)

#### Componentes compartidos de Admin
- **Fase 17:** `src/components/admin/AvisoErp.css` -> [`AvisoErp.jsx`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/components/admin/AvisoErp.jsx)
- **Fase 18:** `src/components/admin/TimbrePedidos.css` -> [`TimbrePedidos.jsx`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/components/admin/TimbrePedidos.jsx)
- **Fase 19:** `src/components/admin/AdminSidebar.css` (+ `AdminSidebarFix.css`) -> [`AdminSidebar.jsx`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/components/admin/AdminSidebar.jsx)
- **Fase 20:** `src/components/admin/AdminHeader.css` -> [`AdminHeader.jsx`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/components/admin/AdminHeader.jsx)
- **Fase 21:** `src/components/admin/AdminTheme.css`, `AdminContentFix.css`, `AdminNavigationHidden.css`
- **Fase 22:** `src/components/admin/MapaRutaDespacho.css` -> [`MapaRutaDespacho.jsx`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/components/admin/MapaRutaDespacho.jsx)
- **Fase 23:** `src/components/analytics/AnaliticaHoraria.css`
- **Fase 24:** `src/components/analytics/ComparativaPeriodos.css`

#### Vistas Operativas de Admin
- **Fase 25:** `src/pages/admin/LoginAdminTheme.css` -> [`LoginAdmin.jsx`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/admin/LoginAdmin.jsx)
- **Fase 26:** `src/pages/admin/Admin.css` y `AdminViewsColorFix.css`
- **Fase 27:** `src/pages/admin/TarifasEnvioAdmin.css` -> [`TarifasEnvioAdmin.jsx`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/admin/TarifasEnvioAdmin.jsx)
- **Fase 28:** `src/pages/admin/RepartidoresAdmin.css` -> [`RepartidoresAdmin.jsx`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/admin/RepartidoresAdmin.jsx)
- **Fase 29:** `src/pages/admin/DespachoAdmin.css` -> [`DespachoAdmin.jsx`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/admin/DespachoAdmin.jsx)
- **Fase 30:** `src/pages/admin/AlmacenAdmin.css` -> [`AlmacenAdmin.jsx`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/admin/AlmacenAdmin.jsx)
- **Fase 31:** `src/pages/admin/CategoriasAdmin.css` -> [`CategoriasAdmin.jsx`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/admin/CategoriasAdmin.jsx)
- **Fase 32:** `src/pages/admin/ClientesAdmin.css` (+ `ClientesAdminDelivery.css`) -> [`ClientesAdmin.jsx`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/admin/ClientesAdmin.jsx)
- **Fase 33:** `src/pages/admin/PersonalAdmin.css` -> [`PersonalAdmin.jsx`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/admin/PersonalAdmin.jsx)
- **Fase 34:** `src/pages/admin/VentasDirectasAdmin.css` -> [`VentasDirectasAdmin.jsx`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/admin/VentasDirectasAdmin.jsx)
- **Fase 35:** `src/pages/admin/PedidosAdmin.css` -> [`PedidosAdmin.jsx`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/admin/PedidosAdmin.jsx)
- **Fase 36:** `src/pages/admin/ReportesAdmin.css` -> [`ReportesAdmin.jsx`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/admin/ReportesAdmin.jsx)
- **Fase 37:** `src/pages/admin/ProductosAdmin.css` (+ parches asociados: `ProductosCreateProfessional.css`, `ProductosCreateMedium.css`, `ProductosModalReference.css`, `ProductosDb.css`, `ProductosDelete.css`, `ColorAssistant.css`) -> [`ProductosAdmin.jsx`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/admin/ProductosAdmin.jsx)

---

### Bloque F: Hojas Globales Restantes (Cierre de Migración)

- **Fase 38:** `src/theme-dark-admin.css` (Unificar variantes `dark:` en los componentes de admin).
- **Fase 39:** `src/theme-dark.css` (Unificar variantes `dark:` en los componentes restantes).
- **Fase 40:** `src/accesibilidad/accesibilidad.css` y `src/components/accesibilidad/accesibilidad.css` (Unificar variantes `contraste:`).
- **Fase 41:** `src/Responsive.css` (Retiro definitivo al no quedar selectores heredados que lo requieran).

---

## 3. Plan de Inicio Inmediato: Fase 1 (`Bienvenida.css`)

Dado que actualmente estamos trabajando en la portada y se requiere que el footer quede bajo el pliegue:
- **Archivo:** `src/pages/Bienvenida.css` y `src/pages/BienvenidaFeaturedHidden.css`.
- **Componente:** `src/pages/Bienvenida.jsx`.
- **Acciones concretas en la Fase 1:**
  1. Reescribir el marcado de `Bienvenida.jsx` con clases de utilidad de Tailwind v4:
     - Contenedor con `min-h-[calc(100dvh-4.25rem)] flex flex-col justify-between`.
     - Hero con `grid grid-cols-1 md:grid-cols-2 gap-8 items-center flex-1`.
     - Franja de garantías con `grid grid-cols-1 sm:grid-cols-3` y bordes sutiles.
  2. Eliminar `src/pages/Bienvenida.css` y `src/pages/BienvenidaFeaturedHidden.css`.
  3. Comprobar que en desktop y kiosco 1024×768 ocupe la pantalla completa sin mostrar el pie al entrar, y que al hacer scroll el pie aparezca fluido.
  4. Ejecutar `npm run lint`, `npm test` y `npm run build`.
