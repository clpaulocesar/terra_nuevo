# Análisis y Catálogo de Archivos CSS en `frontend/`

- **Fecha:** 2026-10-30  
- **Módulo:** `frontend/` (React 19 + Vite 8 + Tailwind CSS v4)  
- **Objetivo:** Mapear la ubicación exacta, propósito, dependencias y estado de migración de todas las hojas de estilo del proyecto.

---

## 1. Resumen Ejecutivo del Ecosistema de Estilos

El frontend se encuentra en un proceso de **migración gradual hacia Tailwind CSS v4**.
- **Módulos Migrados (Sin archivos `.css`)**: Todo el flujo de compra del cliente en [`src/features/`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/features) (`catalogo`, `detalle-producto`, `carrito`, `identificacion`, `confirmacion`, `pedido-generado` y `layout-cliente`) utiliza **Tailwind CSS v4 en el JSX** mediante tokens de diseño `@theme`.
- **Módulos Heredados (Con archivos `.css`)**: El panel de administración ([`src/pages/admin/`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/admin)), el portal de ventas ([`src/pages/vendedor/`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/vendedor)), el portal mayorista ([`src/pages/`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages)) y la portada/categorías aún mantienen hojas CSS dedicadas que se irán retirando en las Fases 4, 5 y 6 del roadmap.

---

## 2. Inventario Detallado por Categoría

### 2.1. Hojas Globales y Base del Sistema (`src/`)

| Archivo | Ubicación | Funcionamiento y Propósito |
|---|---|---|
| [`index.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/index.css) | `src/index.css` | **Punto de entrada de estilos.** Importa `@import "tailwindcss";`, define los tokens `@theme` (paleta TERRA, tipografía *Manrope*, radios, sombras), tokens dinámicos `@theme inline` (`--terra-*`), variantes personalizadas (`dark:`, `contraste:`, `con-resumen-fijo:`), animaciones keyframes y estilos base en `@layer base`. |
| [`theme-dark.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/theme-dark.css) | `src/theme-dark.css` | Define las variables de color del **Modo Noche** para la tienda pública y kiosco (`html[data-theme="dark"]`). Sobrescribe los colores de superficie, bordes, tarjetas y textos para lectura en entornos con poca luz. |
| [`theme-dark-admin.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/theme-dark-admin.css) | `src/theme-dark-admin.css` | Hoja de Modo Noche exclusiva para los paneles de backoffice (Admin y Vendedor). Se carga de forma perezosa (*lazy*) para no aumentar el peso del kiosco de autoservicio. |
| [`Responsive.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/Responsive.css) | `src/Responsive.css` | Reglas responsive globales heredadas (media queries de móviles `<520px` y tablets) que ajustan modales, encabezados y cuadrículas en pantallas que aún no han sido migradas a Tailwind. |

---

### 2.2. Accesibilidad y Experiencia Asistida

| Archivo | Ubicación | Funcionamiento y Propósito |
|---|---|---|
| [`accesibilidad.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/accesibilidad/accesibilidad.css) | `src/accesibilidad/accesibilidad.css` | Gestiona el **Modo Accesible**: Modo de alto contraste (`html.a11y-contraste`), botones táctiles grandes (zonas de toque ≥ 48 px), contornos de foco de alta visibilidad y escala tipográfica al 125 % / 150 %. |
| [`accesibilidad.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/components/accesibilidad/accesibilidad.css) | `src/components/accesibilidad/accesibilidad.css` | Estilos complementarios para los componentes de accesibilidad: lector de pantalla por síntesis de voz, botones de dictado y navegación por voz. |
| [`tutorial.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/tutorial/tutorial.css) | `src/tutorial/tutorial.css` | Estiliza el tour guiado interactivo (*onboarding* con driver.js), adaptando los popovers, botones de "Siguiente" y resaltados con la identidad visual de TERRA. |

---

### 2.3. Componentes de Interfaz y Utilidades Comunes

| Archivo | Ubicación | Funcionamiento y Propósito |
|---|---|---|
| [`TecladoTactil.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/components/ui/TecladoTactil.css) | `src/components/ui/TecladoTactil.css` | Teclado táctil en pantalla optimizado para el kiosco físico. Define disposición QWERTY, números, botones de borrar/aceptar y estados táctiles activos. |
| [`BotonTema.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/components/ui/BotonTema.css) | `src/components/ui/BotonTema.css` | Animación e interactividad del botón de alternancia entre modo claro y modo oscuro (ícono de sol / luna). |
| [`ChatAsistente.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/components/chat/ChatAsistente.css) | `src/components/chat/ChatAsistente.css` | Interfaz del chatbot de asistencia (webhook n8n): burbuja flotante, panel de conversación, globos de mensajes, caja de entrada y animación de "escribiendo...". |
| [`WebAccountModal.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/components/WebAccountModal.css) | `src/components/WebAccountModal.css` | Modal emergente para acceso rápido de clientes mayoristas desde el encabezado (login directo por email y contraseña). |
| [`alertas.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/styles/alertas.css) | `src/styles/alertas.css` | Personalización visual de los modales SweetAlert2 (confirmaciones de compra, errores y advertencias). |
| [`AnaliticaHoraria.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/components/analytics/AnaliticaHoraria.css) | `src/components/analytics/AnaliticaHoraria.css` | Mapas de calor y barras horarias para medir horas pico de tráfico y pedidos en administración. |
| [`ComparativaPeriodos.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/components/analytics/ComparativaPeriodos.css) | `src/components/analytics/ComparativaPeriodos.css` | Tablas y barras comparativas de rendimiento de ventas entre períodos actuales y anteriores. |
| [`ClienteTheme.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/routes/ClienteTheme.css) | `src/routes/ClienteTheme.css` | Clases de apoyo temático para vistas antiguas del cliente antes de su migración completa. |

---

### 2.4. Portada y Navegación del Cliente (No migradas)

| Archivo | Ubicación | Funcionamiento y Propósito |
|---|---|---|
| [`Bienvenida.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/Bienvenida.css) | `src/pages/Bienvenida.css` | Pantalla de inicio del kiosco (`/`): título principal, botón de llamado a la acción ("Comenzar compra"), carrusel fotográfico de poltronas/sofás y franja de confianza con las 3 garantías. |
| [`BienvenidaFeaturedHidden.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/BienvenidaFeaturedHidden.css) | `src/pages/BienvenidaFeaturedHidden.css` | Regla específica para ocultar elementos secundarios destacados dentro de la portada. |
| [`Categorias.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/Categorias.css) | `src/pages/Categorias.css` | Cuadrícula de categorías del showroom (colchones, poltronas, comedores) con contadores de existencias. |

---

### 2.5. Portal B2B Mayorista

| Archivo | Ubicación | Funcionamiento y Propósito |
|---|---|---|
| [`InicioMayorista.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/InicioMayorista.css) | `src/pages/InicioMayorista.css` | Catálogo B2B exclusivo: cuadrícula de productos con visualización directa de precio mayorista, escalas de descuento por volumen y canasta lateral. |
| [`PanelMayorista.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/PanelMayorista.css) | `src/pages/PanelMayorista.css` | Panel de perfil comercial del mayorista: datos fiscales (NIT, razón social), información de contacto y condiciones de compra. |
| [`PedidosMayorista.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/PedidosMayorista.css) | `src/pages/PedidosMayorista.css` | Historial de pedidos por mayor: estados de preparación, pagos, detalles de factura y seguimiento de entrega. |

---

### 2.6. Módulo de Vendedor y Caja

| Archivo | Ubicación | Funcionamiento y Propósito |
|---|---|---|
| [`LoginVendedor.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/vendedor/LoginVendedor.css) | `src/pages/vendedor/LoginVendedor.css` | Formulario de autenticación para vendedores y cajeros en tienda. |
| [`DashboardVendedor.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/vendedor/DashboardVendedor.css) | `src/pages/vendedor/DashboardVendedor.css` | Panel operativo con lista rápida de pedidos pendientes de cobro, accesos directos y métricas de caja. |
| [`VendedorLayout.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/components/vendedor/VendedorLayout.css) | `src/components/vendedor/VendedorLayout.css` | Estructura contenedora del rol vendedor: cabecera superior y barra lateral de navegación. |
| [`ReportePedidosVendedor.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/components/vendedor/ReportePedidosVendedor.css) | `src/components/vendedor/ReportePedidosVendedor.css` | Tablas de resumen diario de cobros por método de pago (efectivo, tarjeta, QR). |

---

### 2.7. Módulo Administrativo / Backoffice

#### Componentes de Layout y Utilidades Admin (`src/components/admin/`)
| Archivo | Funcionamiento y Propósito |
|---|---|
| [`AdminHeader.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/components/admin/AdminHeader.css) | Barra superior del panel de administración: buscador global, estado de la sincronización y menú de usuario. |
| [`AdminSidebar.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/components/admin/AdminSidebar.css) | Barra lateral de navegación con enlaces colapsables a todos los módulos administrativos. |
| [`AdminTheme.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/components/admin/AdminTheme.css) | Variables base y contenedores de administración para modo claro. |
| [`AdminSidebarFix.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/components/admin/AdminSidebarFix.css) | Ajuste de ancho y transición de la barra lateral en tablets y pantallas medianas. |
| [`AdminContentFix.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/components/admin/AdminContentFix.css) | Ajuste de márgenes y scroll del contenedor principal de contenido administrativo. |
| [`AdminNavigationHidden.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/components/admin/AdminNavigationHidden.css) | Oculta selectores y controles innecesarios en vistas reducidas. |
| [`AvisoErp.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/components/admin/AvisoErp.css) | Banners informativos sobre ajustes de precios o stock aplicados tras la verificación con el ERP TERRA. |
| [`TimbrePedidos.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/components/admin/TimbrePedidos.css) | Alerta visual parpadeante y control de notificación sonora cuando entra un nuevo pedido al sistema. |
| [`MapaRutaDespacho.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/components/admin/MapaRutaDespacho.css) | Contenedor para mapas Leaflet utilizados para trazar rutas de reparto y ubicaciones de entrega. |

#### Vistas y Módulos de Gestión (`src/pages/admin/`)
| Archivo | Funcionamiento y Propósito |
|---|---|
| [`Admin.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/admin/Admin.css) | Estilos generales compartidos por todo el backoffice (botones primarios, tarjetas, badges de estado). |
| [`AdminViewsColorFix.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/admin/AdminViewsColorFix.css) | Correcciones de contraste de color en tablas y formularios entre temas claro y oscuro. |
| [`LoginAdminTheme.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/admin/LoginAdminTheme.css) | Diseño del formulario de inicio de sesión de personal administrativo. |
| [`ProductosAdmin.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/admin/ProductosAdmin.css) | Tabla de productos, filtros por categoría, buscador, paginador y modal de edición de datos maestros. |
| [`ProductosCreateProfessional.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/admin/ProductosCreateProfessional.css) | Formulario profesional de creación de producto (galería múltiple, carga a copyparty, medidas, colores). |
| [`ProductosCreateMedium.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/admin/ProductosCreateMedium.css) | Ajustes de diseño de tamaño medio para el formulario de creación. |
| [`ProductosModalReference.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/admin/ProductosModalReference.css) | Modales de vista previa de ficha técnica e impresión de etiquetas con código QR. |
| [`ProductosDb.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/admin/ProductosDb.css) | Indicador visual de estado de sincronización de la base de datos de productos. |
| [`ProductosDelete.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/admin/ProductosDelete.css) | Ventana modal de confirmación para eliminación o desactivación de productos. |
| [`ColorAssistant.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/admin/ColorAssistant.css) | Herramienta para asignar muestras de color y texturas a las variantes de producto. |
| [`PedidosAdmin.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/admin/PedidosAdmin.css) | Gestión completa de pedidos: modal de cobro, verificación en vivo contra el ERP TERRA, cotización y pagos. |
| [`VentasDirectasAdmin.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/admin/VentasDirectasAdmin.css) | Punto de Venta (POS) en caja: creación instantánea de pedidos en mostrador y cobro inmediato. |
| [`ClientesAdmin.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/admin/ClientesAdmin.css) | Directorio de clientes minoristas y mayoristas: asignación de contraseñas B2B y edición de datos. |
| [`ClientesAdminDelivery.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/admin/ClientesAdminDelivery.css) | Gestión de direcciones de entrega de clientes y coordenadas en mapa. |
| [`PersonalAdmin.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/admin/PersonalAdmin.css) | Gestión de cuentas de empleados (`staff_accounts`): asignación de roles `admin`, `vendedor`, `despacho`. |
| [`AlmacenAdmin.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/admin/AlmacenAdmin.css) | Monitor de existencias por almacén, desglose de existencias de `ALMACEN CENTRAL` vs otros almacenes. |
| [`DespachoAdmin.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/admin/DespachoAdmin.css) | Flujo logístico: empaquetado de pedidos, tickets de entrega y asignación a repartidores. |
| [`RepartidoresAdmin.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/admin/RepartidoresAdmin.css) | Registro de choferes, control de estado (activo/en ruta) y vehículos asignados. |
| [`TarifasEnvioAdmin.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/admin/TarifasEnvioAdmin.css) | Configuración de precios de envío por zona o anillo en Santa Cruz de la Sierra. |
| [`ReportesAdmin.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/admin/ReportesAdmin.css) | Métricas ejecutivas: volumen de ventas, métodos de cobro más utilizados y exportación de reportes. |
| [`CategoriasAdmin.css`](file:///home/brayan/Documentos/Proyectos/Chamba/TerraProyecto/terratabletv2.0/frontend/src/pages/admin/CategoriasAdmin.css) | Creación y ordenamiento de categorías y banners del catálogo. |

---

## 3. Estado de la Migración a Tailwind v4

De acuerdo con el documento de arquitectura y roadmap del proyecto:
1. **Fases 0 a 3 (Completadas)**: Se eliminaron los antiguos `Catalogo.css`, `Layout.css`, `FloatingActions.css`, `DetalleProducto.css`, `CarritoPage.css`, `Identificacion.css`, `Confirmacion.css` y `PedidoGenerado.css`. Todo este flujo vive ahora sin archivos `.css` en `src/features/`.
2. **Fase 4 (Pendiente)**: Eliminación de `Bienvenida.css`, `BienvenidaFeaturedHidden.css` y `Categorias.css`.
3. **Fase 5 (Pendiente)**: Eliminación de los archivos de `pages/*Mayorista.css`.
4. **Fase 6 (Pendiente)**: Migración completa de los archivos de administración y vendedores a Tailwind v4.
