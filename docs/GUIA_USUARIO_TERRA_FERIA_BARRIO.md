# GUÍA DE USUARIO Y MANUAL DE OPERACIÓN · TERRA FERIA BARRIO

| Campo | Detalle Operativo Oficial |
|---|---|
| **Sistema** | Plataforma Digital Comercial y Operativa TERRA |
| **Sucursal Oficial** | Feria Barrio · Santa Cruz de la Sierra, Bolivia |
| **Versión del Sistema** | 2.0 (Edición Oficial para Salón de Ventas y Despacho) |
| **Versión del Documento** | 1.0 (Manual Maestro de Operación y Roles) |
| **Fecha de Emisión** | Octubre 2026 |
| **Destinatarios** | Clientes en tienda, Clientes Mayoristas, Administradores, Vendedores y Personal de Despacho |
| **Propósito** | Guía de operación diaria integral de todas las funcionalidades, interfaces, perfiles y flujos del sistema |

---

## Índice General

1. [Introducción y Objetivos del Sistema](#1-introducción-y-objetivos-del-sistema)
2. [Estructura de Roles y Matriz de Permisos](#2-estructura-de-roles-y-matriz-de-permisos)
3. [Acceso, Navegación y Herramientas Transversales](#3-acceso-navegación-y-herramientas-transversales)
4. [Funcionalidades del Rol Cliente en Tienda (Consumidor Final)](#4-funcionalidades-del-rol-cliente-en-tienda-consumidor-final)
5. [Funcionalidades del Rol Cliente Mayorista (B2B)](#5-funcionalidades-del-rol-cliente-mayorista-b2b)
6. [Funcionalidades del Rol Administrador (Backoffice Integral)](#6-funcionalidades-del-rol-administrador-backoffice-integral)
7. [Funcionalidades del Rol Vendedor (Portal de Ventas)](#7-funcionalidades-del-rol-vendedor-portal-de-ventas)
8. [Funcionalidades del Rol Despacho y Repartidores](#8-funcionalidades-del-rol-despacho-y-repartidores)
9. [Ciclo de Vida del Pedido, Métodos de Cobro y Políticas de Seguridad Comercial](#9-ciclo-de-vida-del-pedido-métodos-de-cobro-y-políticas-de-seguridad-comercial)
10. [Accesibilidad Universal, Comandos de Voz y Asistente Virtual Inteligente](#10-accesibilidad-universal-comandos-de-voz-y-asistente-virtual-inteligente)
11. [Guía Rápida de Resolución de Problemas y Preguntas Frecuentes](#11-guía-rápida-de-resolución-de-problemas-y-preguntas-frecuentes)

---

## 1. Introducción y Objetivos del Sistema

### 1.1 Contexto e Identidad
TERRA es la empresa referente en descanso y confort, especializada en colchones de resortes y espuma de alta densidad, sommiers reforzados, almohadas ortopédicas, poltronas ergonómicas y sofás cama versátiles. 

La presente plataforma web integral ha sido diseñada e implementada como el sistema informático oficial de atención al cliente, venta comercial, control de existencias y logística para la **sucursal oficial de TERRA en la Feria Barrio** (Santa Cruz de la Sierra, Bolivia). El sistema sincroniza las operaciones en sala física mediante terminales táctiles de autoservicio, la atención personalizada de vendedores en mostrador, el portal de clientes comerciales mayoristas y el control gerencial de despachos en una sola infraestructura centralizada.

> [IMAGEN: Portada principal oficial del sistema TERRA en la sucursal Feria Barrio]

### 1.2 Objetivo General
Brindar una plataforma digital robusta, ágil e inclusiva que gestione de punta a punta el ciclo comercial de TERRA en Feria Barrio, permitiendo a los clientes explorar el catálogo y ordenar sus pedidos con autonomía, a los vendedores y administradores gestionar ventas y cobranzas sin duplicidades, y al equipo logístico realizar entregas a domicilio con georreferenciación y trazabilidad en tiempo real.

### 1.3 Objetivos Específicos
- **Optimizar la experiencia en sala de ventas**: Reducir tiempos de espera permitiendo que el cliente en tienda explore especificaciones técnicas, variantes de tela y medidas en la terminal táctil de autoservicio o en su teléfono mediante códigos QR, emitiendo su ticket de pedido en menos de 3 minutos.
- **Garantizar la exactitud en precios y stock**: Eliminar discrepancias operativas recalculando precios, promociones y disponibilidad física directamente en servidor mediante transacciones seguras de base de datos.
- **Centralizar y formalizar los pagos en caja**: Facilitar la cobranza a través de efectivo, transferencias QR bancarias interoperables o terminales de tarjeta POS, asociando vouchers digitales a cada ticket emitido.
- **Impulsar las relaciones comerciales mayoristas (B2B)**: Ofrecer un portal exclusivo con precios diferenciados, descuentos progresivos por volumen de compra y programación de despachos con ubicación geográfica precisa.
- **Transparentar la logística de última milla**: Dotar al personal de reparto de una hoja de ruta digital con cálculo de itinerario desde la sucursal Feria Barrio hasta el domicilio del cliente, con enlace directo a navegación GPS por satélite.
- **Garantizar la inclusión y universalidad de uso**: Incorporar herramientas avanzadas de accesibilidad web (contraste reforzado, fuentes para baja visión, lectura por síntesis de voz, comandos vocales y asistente de conversación inteligente).

### 1.4 Principios Fundamentales de Operación
- **Principio de Reserva sin Descuento Prematuro**: La creación de un pedido por parte de un cliente no descuenta automáticamente stock del inventario ni se considera una venta cerrada. La venta se consolida únicamente cuando un vendedor o administrador valida el pago en caja.
- **Privacidad en Terminales Compartidas**: En las terminales táctiles de libre acceso de la tienda, los datos personales ingresados por el cliente residen únicamente en la memoria de la sesión y se limpian automáticamente tras imprimir o mostrar el ticket, evitando que otros clientes puedan visualizarlos.
- **Trazabilidad Absoluta**: Cada pedido posee un código alfanumérico único (`TER-XXXXXXXX`) que identifica el cliente, la fecha, los artículos, el cajero que cobró y el repartidor que efectuó la entrega.

---

## 2. Estructura de Roles y Matriz de Permisos

El sistema TERRA en la sucursal Feria Barrio cuenta con una arquitectura de seguridad basada en roles (RBAC) que asegura que cada colaborador y cliente acceda únicamente a las opciones correspondientes a su función operativa.

### 2.1 Definición de Roles del Sistema

1. **Cliente en Tienda (Consumidor Final)**:
   - Usuario presencial en el salón de exposición de Feria Barrio o visitante web.
   - Interactúa de forma anónima o identificándose en el momento de confirmar su orden.
   - Utiliza la terminal táctil de autoservicio en salón o escanea los códigos QR de los productos en exhibición con su celular.

2. **Cliente Mayorista (Comercial / B2B)**:
   - Cliente empresarial, hotelero, mueblería o revendedor registrado con cuenta corporativa.
   - Cuenta con credenciales de acceso privadas (correo y contraseña).
   - Accede a catálogo con precios mayoristas exclusivos, tramos de descuento por volumen, registro de dirección en mapa para envíos y seguimiento histórico de órdenes.

3. **Administrador**:
   - Supervisor general y responsable comercial de la sucursal Feria Barrio.
   - Acceso irrestricto a todos los módulos: Tablero analítico (Dashboard), Pedidos, Cobranzas, Anulaciones, Ventas directas, Catálogo de productos, Categorías, Almacén, Directorio de clientes, Personal del sistema, Asignación de repartidores, Monitoreo de despacho y Reportes gerenciales.

4. **Vendedor**:
   - Personal de atención en mostrador y caja.
   - Funciones operativas enfocadas en el salón: Recepción y cobro de pedidos emitidos por los clientes, edición de artículos previa al pago a solicitud del comprador, venta directa asistida en mostrador, cancelación/anulación de tickets no concretados y consulta de clientes.

5. **Personal de Despacho (Repartidor)**:
   - Conductor o encargado de la entrega a domicilio en Santa Cruz de la Sierra.
   - Acceso móvil seguro a su panel exclusivo de entregas asignadas, ruta en mapa desde la sucursal Feria Barrio hasta el destino, contacto rápido con el cliente y actualización de las etapas de entrega.

### 2.2 Matriz General de Permisos y Capacidades

| Funcionalidad / Módulo del Sistema | Cliente en Tienda | Cliente Mayorista | Administrador | Vendedor | Despacho |
|---|:---:|:---:|:---:|:---:|:---:|
| Explorar catálogo de productos y precios regulares | Sí | Sí | Sí | Sí | Sí |
| Acceder a tarifas mayoristas y escalas por volumen | No | Sí | Sí (configura) | No | No |
| Escanear códigos QR de productos con cámara | Sí | Sí | Sí | Sí | No |
| Armar carrito y emitir ticket de pedido (`TER-...`) | Sí | Sí | No | No | No |
| Registrar dirección de entrega en mapa interactivo | No | Sí | Sí | No | Sí (consulta) |
| Cobrar tickets y registrar pagos (Efectivo/QR/POS) | No | No | Sí | Sí | No |
| Modificar artículos de un pedido pendiente de pago | No | No | Sí | Sí | No |
| Anular tickets pendientes no concretados | No | No | Sí | Sí | No |
| Realizar ventas directas asistidas en mostrador | No | No | Sí | Sí | No |
| Crear y editar productos, fotos, variantes y precios | No | No | Sí | No | No |
| Administrar líneas y categorías de productos | No | No | Sí | No | No |
| Registrar ingresos de mercadería al almacén | No | No | Sí | No | No |
| Gestionar cuentas de personal y asignar contraseñas | No | No | Sí | No | No |
| Asignar pedidos cobrados a un repartidor | No | No | Sí | No | No |
| Visualizar ruta de entrega y cambiar estado de despacho | No | No (solo estado) | Sí | No | Sí |
| Consultar reportes analíticos y exportar datos | No | No | Sí | No | No |

> [IMAGEN: Diagrama visual de estructura de roles y navegación del sistema TERRA]

---

## 3. Acceso, Navegación y Herramientas Transversales

### 3.1 Puntos de Entrada y Direcciones Web (URLs)
La plataforma opera en una sola aplicación con direccionamiento inteligente según el perfil de usuario:

- **Portal Público y Terminal de Tienda**: `/` (Pantalla de bienvenida y catálogo general).
- **Inicio de Sesión Mayorista**: Acceso desde el botón **Iniciar sesión** en la cabecera o en `/mi-cuenta`.
- **Panel Mayorista Autenticado**: `/mi-cuenta` (Resumen), `/mi-cuenta/perfil` (Dirección y mapa), `/mi-cuenta/pedidos` (Historial).
- **Acceso Administrativo y Personal**: `/admin/login`.
- **Acceso Directo para Vendedores**: `/vendedor/login`.
- **Panel de Despacho para Repartidores**: `/admin/despacho`.

> [IMAGEN: Pantalla de inicio de sesión de personal administrativo y comercial]

### 3.2 Atajo Táctil de Seguridad para el Personal en Salón
Para permitir que los supervisores o vendedores ingresen al panel de gestión desde una terminal táctil de salón sin necesidad de escribir la URL en el navegador:
1. En la cabecera superior izquierda, presiona **cinco (5) veces consecutivas y rápidas** sobre el logotipo de **TERRA**.
2. El sistema detectará la secuencia y redirigirá de inmediato a la pantalla segura de inicio de sesión `/admin/login`.
3. Ingresa el correo corporativo y la contraseña asignada.

### 3.3 Barra de Navegación Superior (Cabecera)
La barra superior se adapta según el dispositivo y el estado de la sesión:
- **Logotipo TERRA**: Retorna a la página de bienvenida de la tienda.
- **Catálogo de Productos**: Acceso directo a la galería completa de modelos y precios.
- **Líneas y Categorías**: Agrupación visual por tipo de producto (Colchones, Sommiers, Almohadas, Sofás, Poltronas).
- **Herramientas de Accesibilidad y Voz**: Botones para dictado por voz y lectura de pantalla.
- **Selector de Tema (Día / Noche)**: Conmuta entre fondo claro y modo oscuro para reducir la fatiga visual.
- **Menú de Cuenta**: Muestra "Iniciar sesión" o, en cuentas mayoristas, las iniciales del cliente, nivel de cuenta y acceso al menú desplegable.
- **Carrito de Compras**: Ícono con burbuja numérica en tiempo real indicando la cantidad total de artículos agregados.
- **Botón Flotante QR**: Acceso permanente con ícono de código QR para escanear etiquetas en sala física.

### 3.4 Vigilante Automático de Inactividad
Para resguardar la privacidad de los clientes en las terminales táctiles de la sucursal Feria Barrio, el sistema monitorea la actividad del usuario en pantalla (toques, clics, desplazamiento o pulsaciones de teclado):
- Tras un lapso de inactividad prolongada sin confirmar un pedido, el sistema limpia la memoria temporal del carrito y regresa la pantalla a la bienvenida institucional, protegiendo nombres, teléfonos y elecciones del cliente anterior.

---

## 4. Funcionalidades del Rol Cliente en Tienda (Consumidor Final)

Este rol permite al visitante de la sucursal Feria Barrio recorrer toda la oferta de descanso de manera interactiva, comparar especificaciones y preparar su compra de forma autónoma.

### 4.1 Pantalla de Bienvenida y Selección de Experiencia
Al aproximarse a la terminal táctil en salón, el cliente es recibido por una interfaz acogedora con la imagen corporativa de TERRA:
- **Botón principal "Ver Catálogo Completo"**: Abre la galería interactiva con todos los productos disponibles en la sucursal.
- **Accesos directos por Categoría**: Tarjetas ilustradas con las líneas destacadas (Colchones, Sommiers, Almohadas, Muebles de Descanso).
- **Banners de Promociones**: Destacados visuales con descuentos temporales o paquetes especiales de temporada.

> [IMAGEN: Pantalla de Bienvenida y selector de categorías de TERRA Feria Barrio]

### 4.2 Catálogo Interactivo de Productos
El catálogo reúne toda la oferta de la sucursal en una vista de tarjetas táctiles de alta definición:
- **Buscador en Tiempo Real**: Permite escribir o dictar palabras clave (ejemplo: *"Queen"*, *"Memory Foam"*, *"Resortes Pocket"*, *"Ortopédico"*). La lista se actualiza instantáneamente sin recargar la página.
- **Filtros por Línea / Categoría**: Pestañas superiores para aislar familias de productos específicas con un solo toque.
- **Criterios de Ordenamiento**: Menú desplegable para ordenar por:
  - *Recomendados*: Selección destacada por los especialistas de TERRA.
  - *Precio: Menor a Mayor*: Para clientes que buscan opciones económicas.
  - *Precio: Mayor a Menor*: Para líneas Premium y de alta gama.
  - *Nombre (A-Z)*: Ordenamiento alfabético.
- **Paginación Inteligente**: Controles inferiores para cambiar de página manteniendo en memoria los filtros y orden elegidos.
- **Información visible en cada tarjeta**: Fotografía del modelo, nombre comercial, categoría, precio oficial en Bolivianos (Bs.), etiqueta de oferta si corresponde y disponibilidad de existencias.

> [IMAGEN: Catálogo interactivo de productos con filtros y buscador activo]

### 4.3 Ficha Técnica y Detalle del Producto
Al tocar cualquier producto del catálogo, se abre una vista detallada con información profunda:
- **Galería de Fotografías**: Fotografías en alta resolución con opción de visualizar detalles de tapiz, costuras y acolchado.
- **Reproductor de Video Demostrativo**: En productos seleccionados, permite reproducir un video corto sobre la estructura interna y confort del colchón.
- **Selector de Medidas / Variantes**:
  - 1 Plaza (0.90 x 1.90 m)
  - 1.5 Plazas (1.05 x 1.90 m)
  - 2 Plazas (1.35 x 1.90 m / 1.40 x 1.90 m)
  - Queen Size (1.60 x 2.00 m)
  - King Size (2.00 x 2.00 m)
  - El precio en pantalla se actualiza en tiempo real de acuerdo con la medida seleccionada.
- **Muestrario de Colores y Telas**: Muestras táctiles de color (Gris Oxford, Beige Lino, Azul Noche, Café Cuero, etc.) para personalizar sommiers, respaldares o sofás cama.
- **Especificaciones Técnicas Detalladas**: Desglose de altura en centímetros, nivel de firmeza (Suave, Medio, Firme, Extra Firme), tecnología de resortes (Pocket enfundados individualmente o Bonnell biónicos), capas de espuma y años de garantía oficial.
- **Control de Cantidades y Stock**: Botones `+` y `-` para definir cuántas unidades se desean, bloqueando la adición si se sobrepasa el stock físico disponible en almacén.
- **Botón "Agregar al Carrito"**: Añade el producto configurado y muestra una confirmación visual en pantalla con el subtotal acumulado.

> [IMAGEN: Ficha detallada de producto con selección de medidas, tela y selector de cantidad]

### 4.4 Compra Rápida por Escaneo de Códigos QR
En el salón de exposición de la sucursal Feria Barrio, cada cama, colchón y sommier exhibido cuenta con una etiqueta física con su código QR oficial:
1. El cliente pulsa el **botón flotante con ícono de QR** situado en el costado derecho de la pantalla (o ingresa desde su teléfono móvil).
2. Se solicita autorización para activar la cámara del dispositivo.
3. El cliente apunta al código QR del producto físico que está probando en el salón.
4. El sistema reconoce la ficha al instante y la añade a un **Borrador QR temporal**.
5. El cliente puede continuar caminando por la tienda y escanear otros productos (por ejemplo, sumando dos almohadas de látex y un protector impermeable).
6. Al finalizar su recorrido, toca **"Cargar al Carrito"** para transferir todos los productos escaneados a su pedido oficial.

> [IMAGEN: Interfaz de escaneo de código QR mediante cámara en la terminal de salón]

### 4.5 Carrito de Compras
Accesible en todo momento desde el ícono superior derecho de la barra de navegación:
- Muestra el listado de todos los artículos seleccionados, especificando medida, color y precio unitario.
- Permite subir o bajar unidades con botones táctiles o eliminar un ítem mediante el ícono de papelera.
- Calcula en tiempo real el Subtotal, el Descuento aplicado y el Total general a pagar en Bolivianos (Bs.).
- Botón **"Vaciar Carrito"**: Para descartar todo y comenzar de nuevo.
- Botón **"Continuar con mi Pedido"**: Conduce al paso de identificación.

> [IMAGEN: Vista del Carrito de Compras con desglose de productos y total calculado]

### 4.6 Identificación del Cliente (Emisión del Ticket)
En este paso, el cliente proporciona los datos mínimos para la emisión de su comprobante:
- **Nombre y Apellido**: Nombre de la persona que recogerá o recibirá el pedido.
- **Teléfono Celular**: Crucial para coordinación por llamada o WhatsApp si requiere entrega o consultas de stock.
- **NIT o Carnet de Identidad (C.I.)**: Opcional en esta etapa; requerido si el cliente precisa factura oficial al momento del cobro.
- **Opción "Continuar como Invitado"**: Permite continuar rápidamente sin llenar datos adicionales si solo se desea obtener el ticket preliminar para consultar en caja.
- Garantía de confidencialidad: El sistema no comparte estos datos y los libera de la pantalla una vez concluida la transacción.

### 4.7 Confirmación y Generación del Ticket Oficial
- Pantalla de revisión final con el detalle completo de los productos y el monto final.
- Al pulsar **"Confirmar Pedido"**, el sistema realiza una llamada al backend, valida que aún exista stock físico en almacén, crea el registro en la base de datos y genera un código de ticket único con formato `TER-XXXXXXXX`.
- La pantalla muestra:
  - El código de pedido en tipografía grande y legible.
  - El monto total en Bolivianos.
  - Instrucciones claras: *"Acércate a la caja de mostrador e indica tu código para realizar el pago por Efectivo, QR o Tarjeta"*.
  - Botón para imprimir ticket físico en la impresora térmica de salón si está conectada.
  - Botón para regresar al inicio para el siguiente cliente.

> [IMAGEN: Pantalla final de éxito con el ticket oficial generado y código TER-XXXXXXXX]

---

## 5. Funcionalidades del Rol Cliente Mayorista (B2B)

El portal B2B está orientado a empresas, distribuidores, hoteles y revendedores que compran volumen habitualmente en TERRA Feria Barrio.

### 5.1 Autenticación y Perfil Corporativo
- El cliente mayorista toca el botón **"Iniciar sesión"** en la esquina superior derecha.
- Ingresa su correo electrónico autorizado y contraseña personal provista por el equipo comercial de TERRA.
- Al ingresar con éxito:
  - La cabecera se transforma, mostrando las iniciales del cliente, su nombre comercial y la insignia de **Cuenta Mayorista Autorizada** (ejemplo: *Nivel Oro*).
  - El menú de cuenta habilita las opciones: *Mi panel mayorista*, *Catálogo mayorista con precios B2B*, *Mis pedidos*, *Mi perfil y datos de facturación* y *Soporte por WhatsApp*.

> [IMAGEN: Menú desplegable de cuenta mayorista autenticada en el sistema]

### 5.2 Catálogo Mayorista con Tarifas B2B y Tramos por Volumen
- Todos los precios mostrados en el catálogo se actualizan automáticamente a la lista de precios mayoristas negociada.
- Cada tarjeta de producto muestra:
  - **Precio unitario mayorista**: Menor al precio de venta a público.
  - **Tabla de tramos por cantidad**: Escala de precios con descuentos adicionales según el volumen agregado al carrito (ejemplo: *de 1 a 5 unidades: Bs. 1.800; de 6 a 11 unidades: Bs. 1.650; más de 12 unidades: Bs. 1.500*).
  - El subtotal del carrito aplica automáticamente el mejor tramo de descuento según el volumen total ordenado.

> [IMAGEN: Catálogo con visualización de precios mayoristas y tabla de tramos por volumen]

### 5.3 Panel Mayorista (`/mi-cuenta`)
Centro de control del comprador comercial donde puede consultar:
- Resumen de su cuenta y estado de vigencia comercial.
- Accesos rápidos para realizar nuevos pedidos recurrentes.
- Datos de facturación registrados (Razón Social y NIT).

### 5.4 Perfil y Georreferenciación de Dirección de Entrega (`/mi-cuenta/perfil`)
Para permitir que TERRA realice entregas a depósitos o tiendas del mayorista sin errores de ubicación:
- Formulario de datos de entrega: Nombre de contacto en recepción, teléfono de almacén, dirección escrita y referencias particulares (ejemplo: *"Calle 3, portón metálico azul al lado de la ferretería"*).
- **Mapa Interactivo de Georreferenciación (Leaflet / OpenStreetMap)**:
  - El cliente mayorista puede pulsar el botón **"Usar mi ubicación actual (GPS)"** si se encuentra en el lugar de entrega.
  - O puede desplazar el mapa interactivo de Santa Cruz de la Sierra y situar el marcador con precisión milimétrica sobre su local o galpón.
  - El sistema almacena las coordenadas exactas de latitud y longitud.
  - **Regla comercial estricta**: La opción de entrega a domicilio para compras mayoristas solo se habilitará en el carrito si el cliente cuenta con una dirección y coordenadas previamente validadas en su perfil. En caso contrario, el sistema ofrecerá únicamente la modalidad de retiro en la sucursal Feria Barrio.

> [IMAGEN: Mapa interactivo en el perfil mayorista para georreferenciación exacta de entrega]

### 5.5 Historial de Pedidos y Recompra Rápida (`/mi-cuenta/pedidos`)
- Listado cronológico de todas las órdenes emitidas por la empresa.
- Información por pedido: Código `TER-...`, fecha de emisión, monto total, estado de cobranza y estado de entrega (Pendiente, En camino, Entregado).
- Al hacer clic en un pedido, se despliega el detalle completo con la lista de artículos y precios aplicados.
- **Botón "Repetir Pedido"**: Carga de inmediato los mismos artículos y cantidades al carrito actual, facilitando la reposición de mercadería en cuestión de segundos.

### 5.6 Canal Directo de Asesoría Comercial por WhatsApp
- Enlace permanente en el menú de cuenta que abre una conversación de WhatsApp con el ejecutivo de cuentas asignado a su empresa en la sucursal Feria Barrio, preconfigurando el mensaje con el nombre de la cuenta y el NIT para una atención inmediata.

---

## 6. Funcionalidades del Rol Administrador (Backoffice Integral)

El Administrador tiene el control total sobre la operación comercial, los inventarios, el personal y los despachos en la sucursal Feria Barrio.

### 6.1 Tablero de Control Ejecutivo (Dashboard)
Pantalla principal tras el inicio de sesión en `/admin`:
- **Tarjetas de Indicadores Clave de Rendimiento (KPIs)**:
  - *Ventas Cobradas*: Monto total recaudado en Bolivianos (Bs.) en el período seleccionado.
  - *Pedidos Totales*: Cantidad de órdenes procesadas en sala y canal mayorista.
  - *Ticket Promedio*: Gasto medio por cliente atendido.
  - *Unidades Vendidas*: Volumen físico total de productos despachados.
  - *Ventas Anuladas*: Importe y cantidad de tickets cancelados antes de cobro.
- **Análisis de Hora Pico**: Gráfica interactiva que revela las horas de mayor afluencia y ventas en la sucursal Feria Barrio para optimizar la dotación de personal.
- **Panel de Alertas de Stock Crítico**: Alerta temprana que lista en color rojo los productos que han alcanzado o bajado del stock mínimo de seguridad en sala, indicando cuántas unidades quedan para gestionar reposición con fábrica.
- **Filtros Temporales**: Conmutador para visualizar datos de *Hoy*, *Esta Semana*, *Este Mes* o *Rango Personalizado*.

> [IMAGEN: Tablero de Control Ejecutivo (Dashboard) con métricas en tiempo real]

### 6.2 Módulo de Gestión de Pedidos y Cobranzas
El corazón de la operativa de caja y seguimiento comercial:
- **Buscador Multicriterio**: Filtrado instantáneo por código de ticket (`TER-...`), nombre del cliente, número de teléfono o NIT.
- **Pestañas de Filtrado por Estado**:
  - *Pendientes de Pago*: Tickets emitidos por clientes en sala o por mayoristas que aún no han abonado.
  - *Cobrados*: Pedidos validados con dinero recibido.
  - *En Despacho*: Pedidos que están siendo transportados a domicilio.
  - *Entregados*: Pedidos con entrega conforme finalizada.
  - *Anulados*: Pedidos descartados antes de concretarse.
- **Detalle del Pedido**: Visualización de los artículos, medidas, colores, subtotales, notas de entrega y datos fiscales.
- **Edición de Pedidos Pendientes**: Permite modificar la orden antes de cobrar si el cliente solicita un cambio de último minuto (añadir un protector de colchón, cambiar la firmeza de la almohada o modificar unidades).
- **Registro Oficial de Cobro**:
  - Al presionar **"Cobrar Pedido"**, se abre el modal financiero.
  - Selección de Método: **Efectivo** (calcula cambio a devolver ingresando el monto recibido), **QR Bancario** (solicita número de transacción o referencia bancaria) o **Tarjeta / POS** (solicita código de autorización del voucher).
  - **Adjuntar Comprobante**: Permite cargar una fotografía o captura digital del comprobante o voucher bancario para auditoría contable.
  - Al confirmar, el sistema actualiza el estado a "Cobrado" y permite imprimir el comprobante fiscal o ticket final.
- **Anulación Justificada de Pedidos**:
  - Disponible exclusivamente para pedidos en estado *Pendiente*.
  - Exige ingresar el motivo de cancelación (ejemplo: *"Cliente desistió por falta de transporte propio"*, *"Error en la selección de medida"*).
  - La anulación queda registrada con fecha, hora y usuario responsable en el historial de auditoría.

> [IMAGEN: Módulo de Gestión de Pedidos con ventana de cobro y carga de comprobante]

### 6.3 Módulo de Ventas Directas en Mostrador
Diseñado para cuando un cliente prefiere ser atendido directamente por el personal en caja sin interactuar con la terminal de autoservicio:
- Catálogo rápido de selección de artículos con buscador ágil.
- Adición de productos con variantes y ajuste de cantidades.
- Búsqueda y vinculación a un cliente registrado en la base de datos o creación rápida de un nuevo cliente con nombre, teléfono y NIT.
- Cobro en el mismo paso y emisión simultánea del ticket ya cobrado.

### 6.4 Módulo de Productos y Catálogo Maestro
Administración de todo el catálogo físico y digital de TERRA:
- **Listado Maestro**: Tabla con miniatura fotográfica, código SKU, nombre, categoría, existencias físicas, precio regular y precio mayorista.
- **Creación y Edición de Productos**:
  - Campos: Nombre comercial, descripción detallada, categoría y orden de aparición.
  - Precios: Precio regular de venta, precio de oferta con descuento porcentual y precio mayorista base.
  - Matriz de Tramos B2B: Definición de cantidades mínimas y precios especiales por volumen.
  - Galería Multimedia: Subida de múltiples fotografías y enlace a video demostrativo.
  - Variantes y Colores: Configuración de medidas y colores disponibles para el modelo.
  - Interruptor de Visibilidad: Permite ocultar temporalmente un producto del salón de clientes sin eliminarlo del sistema.
- **Generador de Códigos QR para Exhibición**:
  - Herramienta que genera automáticamente el código QR único para cada producto del catálogo.
  - Botón **"Imprimir QR"**: Genera una ficha lista para impresión para plastificar y colocar sobre los colchones y sommiers en el salón de la sucursal Feria Barrio.

> [IMAGEN: Formulario de creación y edición de productos con generador de códigos QR]

### 6.5 Módulo de Líneas y Categorías
- Creación y edición de las familias de productos (ejemplo: Colchones de Resortes, Colchones de Espuma, Sommiers y Bases, Almohadas y Accesorios, Sofás Cama).
- Carga de imágenes de portada y asignación de íconos representativos para la navegación táctil.
- Definición del orden de jerarquía visual en la pantalla de bienvenida.

### 6.6 Módulo de Almacén e Inventario
Control estricto de las existencias disponibles en la sucursal Feria Barrio:
- Vista general de stock actual clasificado por producto y medida.
- **Recepción de Mercadería (Entrada de Almacén)**:
  - Formulario de ingreso de unidades provenientes de fábrica o transferencias entre sucursales.
  - Posibilidad de ingresar stock manualmente por código o mediante lectura de códigos de barras / QR con escáner.
  - Registro de notas de remisión de fábrica y observaciones de control de calidad.

> [IMAGEN: Módulo de Almacén e Inventario con registro de entradas y stock crítico]

### 6.7 Módulo de Directorio de Clientes
- Directorio unificado con búsqueda por nombre, razón social, NIT o teléfono.
- Ficha individual de cliente con historial completo de compras acumuladas.
- **Activación de Condición Mayorista**: Permite al Administrador convertir una cuenta de cliente común en Cliente Mayorista Autorizado, asignándole nivel de tarifa comercial.
- Actualización de teléfonos de contacto y direcciones físicas para facturación.

### 6.8 Módulo de Administración de Personal
Gestión de los usuarios que operan el sistema en la sucursal:
- Registro de nuevos colaboradores asignando sus datos personales y rol operativo (**Administrador**, **Vendedor** o **Despacho**).
- Modificación de credenciales de acceso (correo corporativo y reseteo de contraseñas).
- Activación o desactivación inmediata de cuentas por rotación de turnos o cese de funciones.

### 6.9 Módulo de Repartidores
Configuración de la flota de entrega de la sucursal Feria Barrio:
- Registro de conductores autorizados y vinculación a una cuenta de usuario con rol *Despacho*.
- Registro de tipo de vehículo (camión de carga, furgón cerrado, camioneta) y número de placa de circulación.
- Control visual del número de envíos asignados actualmente a cada conductor.
- **Asignación de Pedidos**: Herramienta donde el Administrador toma un pedido cobrado que solicitó despacho a domicilio y lo transfiere a un conductor específico para su entrega.

### 6.10 Módulo de Despacho Centralizado y Hoja de Ruta
Supervisión global de las entregas en curso en Santa Cruz de la Sierra:
- Tabla de envíos con estado: *En preparación*, *En camino* o *Entregado*.
- **Mapa Centralizado en Tiempo Real**:
  - Muestra la ubicación fija de la sucursal **TERRA Feria Barrio** como punto de origen de todas las rutas.
  - Despliega marcadores con los destinos de todos los pedidos en despacho.
  - Dibuja el trazado de ruta óptima calculado por el motor cartográfico OpenStreetMap / OSRM.
  - Permite verificar si los repartidores están cumpliendo con los itinerarios programados.

> [IMAGEN: Módulo de Despacho Centralizado con mapa de rutas y pedidos en camino]

### 6.11 Módulo de Reportes Estadísticos y Exportación
Generación de inteligencia comercial para la toma de decisiones:
- **Reporte de Ventas por Período**: Comparativas diarias, semanales, mensuales y anuales de recaudación en la sucursal Feria Barrio.
- **Reporte por Métodos de Pago**: Desglose porcentual y monetario del dinero recibido en Efectivo, pagos QR y tarjetas POS.
- **Ranking de Productos Más Vendidos**: Identificación de los modelos y medidas de mayor rotación física.
- **Reporte de Clientes Destacados**: Listado de los compradores mayoristas con mayor volumen de compra para fidelización comercial.
- Botones de exportación para auditoría externa y balances contables.

---

## 7. Funcionalidades del Rol Vendedor (Portal de Ventas)

El Vendedor cuenta con una interfaz simplificada y de alta velocidad (`/vendedor`), pensada para la atención continua de clientes en mostrador y caja sin distracciones administrativas.

### 7.1 Dashboard Operativo de Turno
Al ingresar a su portal, el vendedor visualiza su rendimiento diario:
- Ventas totales cobradas en su turno actual.
- Número de pedidos atendidos en el día.
- Unidades de descanso despachadas.
- Cancelaciones o anulaciones registradas.

### 7.2 Cobro Rápido de Tickets Emitidos en Sala
Flujo estándar cuando un cliente finaliza su elección en la terminal táctil de sala:
1. El cliente se acerca al mostrador de caja con su código `TER-XXXXXXXX` (impreso en papel o en la pantalla de su teléfono).
2. El vendedor escribe el código en el buscador de la pestaña **Pedidos**.
3. El sistema muestra de inmediato el desglose de productos y el monto a cobrar en Bolivianos.
4. Si el cliente solicita un cambio de último momento (ejemplo: cambiar el color de una base sommier o sumar almohadas), el vendedor pulsa **"Editar"**, ajusta los productos y guarda los cambios.
5. El vendedor presiona **"Cobrar"**:
   - En **Efectivo**: Ingresa el monto entregado por el cliente; el sistema calcula el cambio exacto.
   - En **QR**: Muestra el código QR bancario de TERRA al cliente, valida la acreditación en la cuenta e ingresa la referencia.
   - En **Tarjeta**: Procesa el cobro en el terminal POS físico y digita el número de comprobante.
6. El vendedor pulsa **"Confirmar Cobro"** y entrega el ticket sellado o impreso al cliente.

> [IMAGEN: Portal del Vendedor con proceso de cobro ágil de un ticket de sala]

### 7.3 Ventas Directas en Mostrador
- Para clientes que desean ser asesorados íntegramente por el vendedor sin usar la terminal táctil:
- El vendedor abre **"Ventas Directas"**, elige los productos del catálogo rápido, ingresa los datos del cliente, aplica el método de pago y genera la venta cobrada en una sola acción.

### 7.4 Anulación de Tickets No Concretados
- Si un cliente generó un ticket en la terminal táctil pero se retira de la sucursal sin efectuar el pago o decide postergar su compra, el vendedor abre el pedido y selecciona **"Anular"**, ingresando la causa respectiva para mantener limpia la lista de pedidos pendientes de caja.

### 7.5 Consulta de Directorio de Clientes
- Permite al vendedor buscar clientes antiguos para recuperar rápidamente sus datos fiscales (NIT y Razón Social) y evitar que deban dictarlos nuevamente en cada compra.

---

## 8. Funcionalidades del Rol Despacho y Repartidores

El personal de despacho utiliza una interfaz adaptativa pensada primordialmente para su operación desde teléfonos móviles o tablets en ruta (`/admin/despacho`).

### 8.1 Acceso y Bandeja Exclusiva de Envíos Asignados
- El repartidor inicia sesión con su cuenta asignada de rol *Despacho*.
- **Filtro estricto de privacidad**: El repartidor únicamente puede ver los pedidos que el Administrador le ha asignado a su nombre y vehículo. No tiene acceso a los pedidos de otros repartidores ni a las finanzas globales de la tienda.
- La pantalla muestra los pedidos ordenados con tarjetas claras de entrega.

> [IMAGEN: Panel móvil de Despacho con lista de pedidos asignados al repartidor]

### 8.2 Ficha Completa del Envío a Domicilio
Cada tarjeta de entrega asignada contiene toda la información necesaria para el viaje:
- **Datos del Cliente**: Nombre completo y número de teléfono celular.
- **Botones de Comunicación Directa**:
  - *Llamar*: Realiza una llamada telefónica convencional de un toque al cliente para coordinar llegada.
  - *WhatsApp*: Abre un chat directo de WhatsApp con un mensaje predefinido anunciando la entrega.
- **Detalle Físico de Mercadería**: Relación de colchones, sommiers o almohadas que deben descargarse del vehículo para control de entrega.
- **Dirección y Referencias**: Dirección escrita con puntos de referencia específicos registrados por el cliente.
- **Estado Financiero**: Indicador visual en verde que confirma que el pedido ya fue pagado previamente en la sucursal.

### 8.3 Mapa Integrado y Navegación GPS por Satélite
- Cada envío con georreferenciación muestra un mapa interactivo con la ruta trazada desde la sucursal **TERRA Feria Barrio** hasta la puerta del domicilio del destinatario.
- **Botón "Abrir en Google Maps"**: Al pulsarlo, el sistema transfiere de forma transparente las coordenadas GPS a la aplicación Google Maps del celular del repartidor, iniciando de inmediato la guía de navegación por voz paso a paso en el tráfico de Santa Cruz.

> [IMAGEN: Ficha de entrega con mapa de ruta trazada y botón de navegación en Google Maps]

### 8.4 Flujo Operativo y Actualización de Etapas de Entrega
El repartidor es responsable de actualizar el estado del envío mediante dos botones de acción:
1. **Botón "Salir a Entregar"**: Se presiona al momento de cargar el vehículo y salir de la sucursal Feria Barrio. El pedido cambia a estado **"En Camino"**, permitiendo que la administración y el cliente sepan que la mercadería está en ruta.
2. **Botón "Confirmar Entrega"**: Se pulsa cuando el cliente recibe conforme sus productos en su domicilio. El pedido se cierra con éxito como **"Entregado"**.
3. **Gestión de Incidencias**: Si se presenta un imprevisto que impida la entrega (ejemplo: cliente ausente, dirección inaccesible), el repartidor puede retornar el pedido a estado pendiente con una nota de observación para que administración reprograme el viaje.

---

## 9. Ciclo de Vida del Pedido, Métodos de Cobro y Políticas de Seguridad Comercial

### 9.1 Diagrama de Estados del Pedido en TERRA

```
[ Cliente en Tienda / Mayorista ]
               │
               ▼
   ( Genera Ticket / Pedido )
               │
               ▼
     [ PENDIENTE DE PAGO ] ─────────── ( Cliente cancela ) ──────────► [ ANULADO ]
               │                                                      (Motivo registrado)
      ( Cobro verificado en Caja )
               │
               ▼
          [ COBRADO ]
               │
     ┌─────────┴─────────┐
     ▼                   ▼
(Retiro en Tienda)  (Envío a Domicilio)
     │                   │
     │            (Asignación a Repartidor)
     │                   │
     │                   ▼
     │            [ EN DESPACHO ]
     │                   │
     │             ("Salir a entregar")
     │                   │
     │                   ▼
     │              [ EN CAMINO ]
     │                   │
     │             ("Confirmar entrega")
     │                   │
     └─────────┬─────────┘
               ▼
         [ ENTREGADO ]
```

### 9.2 Políticas y Protocolos de Cobranza en Caja
1. **Cobranza en Efectivo**:
   - El cajero debe verificar minuciosamente la autenticidad de los billetes de corte nacional (especialmente billetes de 100 y 200 Bolivianos).
   - El sistema calcula automáticamente el cambio a entregar al digitar la suma recibida.
2. **Cobranza mediante QR Bancario Interoperable**:
   - El cajero solicita al cliente escanear el código QR estático de la cuenta oficial de TERRA o el QR dinámico en pantalla.
   - El cajero DEBE verificar en la aplicación bancaria de la empresa que el dinero haya ingresado efectivamente antes de presionar "Confirmar Cobro".
   - Se debe registrar el número de referencia o código de operación en el campo correspondiente del sistema.
3. **Cobranza con Tarjeta de Débito o Crédito**:
   - La tarjeta se procesa en el terminal electrónico POS bancario.
   - El cobro se valida en el sistema únicamente tras la emisión exitosa del voucher aprobado por la red de pagos.

---

## 10. Accesibilidad Universal, Comandos de Voz y Asistente Virtual Inteligente

La plataforma incorpora tecnologías avanzadas de inclusión web para asegurar que cualquier persona, independientemente de sus capacidades físicas, sensoriales o edad, pueda interactuar con el sistema de TERRA Feria Barrio.

### 10.1 Panel de Accesibilidad Universal
Accesible mediante el botón flotante de accesibilidad en pantalla:
- **Modo Alto Contraste**: Invierte y refuerza los colores a tonos oscuros profundos con textos amarillos y blancos de máximo contraste para personas con visión reducida o baja agudeza visual.
- **Aumento de Tamaño de Fuente (Zoom 125% y 150%)**: Escala todos los textos de la interfaz sin alterar la estructura ni provocar desbordes de página.
- **Tipografía Inclusiva Atkinson Hyperlegible**: Aplica una fuente tipográfica diseñada médicamente para maximizar la distinción entre caracteres similares (ejemplo: 1, l, I, 0, O).
- **Zonas Táctiles Ampliadas**: Todos los botones y controles táctiles cumplen la norma de tamaño mínimo de 48x48 píxeles para facilitar la pulsación en personas con temblores o movilidad reducida.

> [IMAGEN: Panel de Accesibilidad activado con alto contraste y tipografía inclusiva]

### 10.2 Navegación Guiada por Voz y Lector de Pantalla
- **Lector de Pantalla Integrado**: Lee en voz alta mediante síntesis vocal el título de la página activa, el nombre de los productos, sus características principales y los precios al seleccionarlos.
- **Navegación por Comandos de Voz**: Permite al cliente o al personal operar el sistema hablando al micrófono de la terminal. Comandos admitidos:
  - *"Ir al catálogo"* o *"Ver productos"*.
  - *"Abrir carrito"* o *"Ver mi compra"*.
  - *"Buscar colchón Queen"*, *"Buscar sommier"*, *"Buscar almohada"*.
  - *"Activar modo noche"* o *"Activar modo día"*.
  - *"Subir tamaño de letra"* o *"Bajar letra"*.

### 10.3 Chat Asistente Virtual Inteligente
- Disponible en la esquina inferior mediante una burbuja flotante de diálogo.
- El asistente resuelve dudas comunes del cliente en tiempo real:
  - Diferencias de confort entre resortes Pocket (independientes) y Bonnell (enlazados).
  - Medidas estándar de camas en Bolivia.
  - Recomendaciones de colchón según el peso de la persona o problemas de espalda.
  - Indicaciones para ubicar la caja y pagar su ticket en la sucursal Feria Barrio.

> [IMAGEN: Asistente virtual de conversación resolviendo consultas sobre colchones]

---

## 11. Guía Rápida de Resolución de Problemas y Preguntas Frecuentes

| Incidencia o Mensaje | Causa Común | Solución Recomendada Paso a Paso |
|---|---|---|
| **Error: "Credenciales incorrectas" al iniciar sesión** | Correo mal escrito, contraseña errónea o cuenta desactivada. | Verifique que no haya espacios al final del correo. Si el problema persiste, el Administrador debe resetear la contraseña en el módulo Personal. |
| **No se visualiza un producto en el catálogo de clientes** | El producto tiene stock en cero o el interruptor "Visible" está apagado. | Ingrese a `/admin/productos`, verifique que el switch "Visible" esté activo y que el stock físico sea mayor a cero en Almacén. |
| **La cámara no se activa al intentar escanear un código QR** | El navegador no cuenta con permisos para usar la cámara web o del móvil. | En la barra de direcciones del navegador, haga clic en el ícono de candado / permisos y seleccione "Permitir cámara". Luego recargue la página. |
| **No aparece la opción de "Envío a Domicilio" en el carrito mayorista** | La cuenta mayorista no tiene registrada su dirección y coordenadas en el perfil. | Vaya a `Mi Cuenta > Mi Perfil`, ingrese su dirección y marque su ubicación en el mapa interactivo. Guarde los cambios y regrese al carrito. |
| **El repartidor no visualiza un pedido en su lista de despacho** | El Administrador aún no le ha asignado formalmente el pedido a su nombre. | El Administrador debe ingresar a `/admin/repartidores`, seleccionar el pedido cobrado y asignarlo al conductor respectivo. |
| **El mapa de ruta no carga la línea de itinerario** | Las coordenadas del cliente son inexistentes o no hay conexión a internet. | Pulse el botón alternativo **"Abrir en Google Maps"** para navegar con el GPS nativo del dispositivo móvil. |
| **Error: "Stock insuficiente" al intentar confirmar un pedido** | Otro usuario o vendedor cobró las últimas unidades en ese mismo instante. | El sistema protege las existencias reales. Debe reducir la cantidad en el carrito o seleccionar otra variante disponible. |
| **La terminal táctil se reinició y borró los productos en pantalla** | Operó el Vigilante Automático de Inactividad por abandono prolongado de la terminal. | Es una medida de seguridad y privacidad en sala. Vuelva a seleccionar los productos deseados y continúe. |

---

## Conclusión y Recomendaciones de Operación Oficial

La plataforma comercial TERRA en la **sucursal Feria Barrio** constituye una herramienta integral que conecta al cliente, a la sala de ventas, a la administración y al equipo de logística en una sola experiencia fluida y confiable. 

Para asegurar una operación impecable en la tienda:
1. Todo colaborador debe trabajar estrictamente bajo su cuenta y rol asignado.
2. Ningún pedido debe entregarse o salir a reparto sin que el estado figure como **"Cobrado"** en el sistema.
3. Se debe cerrar sesión al concluir cada turno para salvaguardar la integridad de las ventas y la auditoría de caja.
4. Para consultas comerciales o soporte de sistemas en la sucursal Feria Barrio, recurra al Administrador General de la tienda.
