# Guía de usuario · TERRA La Feria

| Campo | Información |
|---|---|
| Sistema | TERRA · Plataforma comercial y operativa |
| Sucursal | La Feria · Av. Carmelo Ortiz 3795, Santa Cruz de la Sierra |
| Versión del documento | 1.0 |
| Dirigido a | Clientes, mayoristas, administración, vendedores y despacho |
| Propósito | Uso diario del sistema; no incluye instalación técnica ni configuración de servidores. |

## Índice

1. Introducción y objetivo
2. Alcance y roles
3. Acceso y navegación
4. Cliente final
5. Cliente mayorista
6. Administrador
7. Vendedor
8. Despacho y repartidores
9. Pagos, pedidos y anulaciones
10. Accesibilidad, voz y asistente
11. Problemas frecuentes

## 1. Introducción y objetivo

TERRA es la plataforma oficial de consulta, pedidos y gestión comercial de la sucursal La Feria. Permite que el cliente conozca el catálogo, arme un pedido y obtenga un ticket; a la vez permite que el equipo comercial administre ventas, productos, clientes, pagos, despachos y reportes desde un mismo sistema.

El objetivo es ordenar la atención, reducir errores de precio y stock, registrar cada pedido con un código único y dar trazabilidad al pago y a los envíos a domicilio. La aplicación está diseñada para usarse en tablet, computadora o celular, de acuerdo con el rol de cada persona.

> [IMAGEN: Portada o pantalla de inicio oficial de TERRA La Feria]

### Principios de uso

- Los precios y el stock visibles son información operativa; antes de confirmar un pedido el sistema los valida nuevamente.
- Un pedido pendiente no equivale a una venta cobrada.
- Los datos de clientes deben usarse solo para atender su pedido.
- Cada persona debe ingresar con su propia cuenta y cerrar sesión al terminar el turno.

## 2. Alcance y roles

| Rol | Objetivo principal | Funciones disponibles |
|---|---|---|
| Cliente final | Consultar y solicitar productos | Catálogo, búsqueda, detalle, carrito, identificación, ticket y consulta por QR. |
| Cliente mayorista | Comprar con condiciones comerciales B2B | Inicio de sesión, precios mayoristas, perfil, dirección, pedidos y solicitud de envío. |
| Administrador | Supervisar y configurar la operación | Tablero, productos, categorías, almacén, pedidos, ventas directas, clientes, personal, repartidores, despacho y reportes. |
| Vendedor | Atender ventas y cobrar pedidos | Resumen operativo, pedidos, clientes y ventas directas. |
| Despacho | Entregar pedidos asignados | Panel propio, envíos asignados, mapa/ruta y actualización de entrega. |

### Matriz resumida de permisos

| Función | Cliente | Mayorista | Admin | Vendedor | Despacho |
|---|---:|---:|---:|---:|---:|
| Consultar catálogo | Sí | Sí | Sí | Sí | Sí |
| Crear pedido | Sí | Sí | No | No | No |
| Precios mayoristas | No | Sí | No | No | No |
| Cobrar pedido | No | No | Sí | Sí | No |
| Anular pedido pendiente | No | No | Sí | Sí | No |
| Gestionar productos y stock | No | No | Sí | No | No |
| Gestionar personal | No | No | Sí | No | No |
| Asignar repartidor | No | No | Sí | No | No |
| Ver y actualizar envíos propios | No | No | Sí | No | Sí |

> [IMAGEN: Diagrama de roles y acceso al sistema]

## 3. Acceso y navegación

### Cliente final

No necesita una cuenta. Desde la página de inicio puede abrir el catálogo, categorías, ofertas, carrito o asistente virtual.

### Cliente mayorista

1. Selecciona **Iniciar sesión**.
2. Ingresa el correo y contraseña entregados por TERRA.
3. Al acceder, el menú muestra su cuenta y habilita **Mi cuenta**, **Perfil** y **Mis pedidos**.
4. Para salir, abre el menú de cuenta y selecciona **Cerrar sesión**.

### Administrador, vendedor y despacho

1. Abre la dirección de TERRA seguida de `/admin/login`.
2. Ingresa correo corporativo y contraseña.
3. El administrador ingresa al panel administrativo; el vendedor puede usar también `/vendedor/login`; el personal de despacho ingresa directamente a su panel de despacho.
4. Usa **Cerrar sesión** al finalizar el turno.

Importante: la sesión administrativa dura un tiempo limitado. Si aparece un mensaje de sesión vencida, vuelve a iniciar sesión.

> [IMAGEN: Pantalla de inicio de sesión de personal]

## 4. Cliente final

### 4.1 Consultar catálogo y productos

El catálogo permite buscar por nombre, filtrar por categoría, ver ofertas y ordenar resultados. Cada tarjeta muestra disponibilidad, precio y acceso al detalle del producto.

En el detalle se pueden revisar imágenes, descripción, características, colores cuando existan, stock, precio y productos relacionados. Selecciona la cantidad y pulsa **Agregar al carrito**.

### 4.2 Compra por código QR

El cliente puede escanear el código QR de un producto desde el catálogo o abrir la ficha del producto desde su teléfono. Los productos escaneados se acumulan en un borrador temporal y luego se pasan al carrito.

El permiso de cámara debe aceptarse cuando el navegador lo solicite. El borrador QR conserva únicamente productos y cantidades; no conserva datos personales.

### 4.3 Carrito, identificación y ticket

1. Revisa productos, cantidades y total estimado en **Carrito**.
2. Ajusta cantidades o elimina líneas si es necesario.
3. Selecciona **Continuar**.
4. Completa nombre, teléfono y NIT solo si corresponde; también se puede continuar como invitado cuando la pantalla lo permita.
5. En **Confirmación**, revisa el pedido y pulsa **Confirmar pedido**.
6. Guarda o presenta el ticket con código `TER-XXXXXXXX` al personal de TERRA.

El sistema genera el pedido como pendiente de pago. El pago se registra posteriormente por personal autorizado.

> [IMAGEN: Catálogo, carrito y ticket generado]

## 5. Cliente mayorista

### 5.1 Compra mayorista

Después de iniciar sesión, el catálogo aplica precios mayoristas y, cuando existan, precios por tramo según cantidad. El cliente puede ajustar unidades dentro del stock disponible y agregar los productos al pedido.

### 5.2 Perfil y dirección de entrega

En **Mi cuenta > Perfil**, el mayorista puede mantener nombre comercial, contacto, NIT, teléfono, dirección y referencia. Puede ubicar su domicilio mediante GPS o seleccionando un punto en el mapa.

La opción de envío a domicilio solo se habilita cuando la cuenta tiene una dirección registrada. El envío es opcional; el cliente puede elegir retiro en tienda.

### 5.3 Historial de pedidos

En **Mi cuenta > Mis pedidos** se muestran los pedidos vinculados a la cuenta, su ticket, artículos, importe y avance de despacho cuando aplique. Desde el historial se puede revisar el detalle y repetir una compra cuando esté disponible.

> [IMAGEN: Perfil mayorista, mapa de dirección y pedidos]

## 6. Administrador

El administrador cuenta con todas las funciones operativas. Debe verificar la información antes de confirmar cambios que afecten precios, stock, pagos o cuentas.

### 6.1 Dashboard

El tablero muestra ventas cobradas, pedidos, ticket promedio, unidades vendidas, ventas anuladas, hora de mayor actividad, clientes con compra, últimos pedidos y alertas de stock crítico. Permite elegir el período y actualizar la información.

### 6.2 Pedidos y pagos

En **Pedidos** se puede buscar por ticket, número, nombre, teléfono o NIT; filtrar por estado; abrir el detalle; imprimir ticket; editar artículos de pedidos pendientes; registrar pago y anular una venta pendiente por cancelación del cliente.

Para cobrar, abre el pedido pendiente, selecciona el método registrado (**QR**, **Efectivo** o **Tarjeta**), adjunta comprobante si corresponde y confirma el pago. Nunca confirmes un pago sin verificarlo físicamente o con el comprobante válido.

Un pedido anulado se conserva en la pestaña **Anulados** y no debe cobrarse posteriormente.

### 6.3 Ventas directas y clientes

**Ventas directas** permite crear una venta atendida por el personal: buscar productos, ajustar cantidades, asociar un cliente y registrar el método de pago.

En **Clientes** se consulta el directorio, se registra información comercial y se habilitan cuentas mayoristas cuando corresponde.

### 6.4 Productos, categorías y almacén

En **Productos** se crean o editan productos, precios, ofertas, información mayorista, imágenes, video, colores, visibilidad y código QR. En **Categorías** se administran las categorías visibles. En **Almacén** se registran ingresos de mercadería por código manual o QR y se consulta la disponibilidad.

### 6.5 Personal, repartidores y despacho

En **Personal** se registran cuentas de administrador, vendedor y despacho; se pueden editar datos operativos, activar/desactivar cuentas o eliminar cuentas de ejemplo que ya no se usarán.

En **Repartidores** se actualizan vehículo y placa, se revisa la carga de envíos y se asigna cada pedido a domicilio a una persona de despacho activa.

En **Despacho**, el administrador supervisa todos los envíos, conductor asignado, contacto, dirección, mapa, ruta y etapa de entrega.

### 6.6 Reportes

**Reportes** reúne información de ventas por período, productos, categorías, métodos de pago y horarios. Usa los filtros antes de exportar o presentar resultados.

> [IMAGEN: Dashboard administrativo y menú lateral]
> [IMAGEN: Pedidos, pago y anulación]
> [IMAGEN: Productos, almacén y reportes]

## 7. Vendedor

El vendedor usa el portal de ventas para atender la operación diaria sin acceso a la configuración general.

### Funciones

- Consultar su resumen operativo: ventas, pedidos, productos vendidos y ventas anuladas del día.
- Buscar pedidos y clientes.
- Cobrar pedidos pendientes con QR, efectivo o tarjeta.
- Adjuntar comprobante cuando sea necesario.
- Editar los artículos de un pedido pendiente antes de cobrar.
- Anular una venta pendiente cuando el cliente cancela.
- Registrar ventas directas.
- Imprimir ticket.

El vendedor no debe modificar productos, categorías, stock, personal, repartidores ni reportes administrativos.

> [IMAGEN: Portal del vendedor y cobro de pedido]

## 8. Despacho y repartidores

### 8.1 Asignación por administración

Antes de que una persona de despacho pueda entregar un pedido, el administrador debe asignarle el envío desde **Repartidores**. El pedido debe tener entrega a domicilio y dirección registrada.

### 8.2 Panel del personal de despacho

Al iniciar sesión, el personal de despacho entra a su panel propio. Solo ve los envíos que fueron asignados a su cuenta; no puede ver ni modificar los envíos de otros repartidores.

Cada envío muestra cliente, teléfono, artículos, importe, dirección, referencia, conductor asignado, estado de pago y acciones de contacto. Si la ubicación fue registrada, **Ver ruta** abre un mapa con una ruta calculada desde TERRA La Feria. **Abrir Maps** permite continuar la navegación en la aplicación de mapas.

### 8.3 Actualizar la entrega

1. Revisa cliente, dirección y ruta.
2. Al salir, pulsa **Salir a entregar**: el pedido queda **En camino**.
3. Al completar la entrega, pulsa **Confirmar entrega**.
4. Si hubo un error antes de entregar, usa **Volver a pendiente**.

La etapa de entrega es independiente del estado de pago. No marques como entregado un pedido que no fue recibido por el cliente.

> [IMAGEN: Panel de despacho con ruta ampliada]

## 9. Pagos, pedidos y anulaciones

| Estado | Significado | Acción permitida |
|---|---|---|
| Pendiente de pago | Pedido creado, sin cobro confirmado | Cobrar, editar artículos o anular. |
| Cobrado | Pago registrado por personal autorizado | Consultar, imprimir o gestionar entrega. |
| En despacho | Pedido asociado a una entrega en curso | Actualizar la etapa de entrega. |
| Entregado | Entrega confirmada | Consultar historial. |
| Anulado | Cliente canceló una venta pendiente | Consultar; no cobrar ni editar. |

### Buenas prácticas de pago

- QR: verifica el movimiento y referencia antes de confirmar.
- Efectivo: verifica el monto recibido antes de registrar el cobro.
- Tarjeta: verifica la aprobación o voucher del POS.
- Comprobante: adjúntalo cuando ayude a respaldar la operación.
- Anulación: úsala solo antes del cobro y registra la cancelación real del cliente.

## 10. Accesibilidad, voz y asistente

### Modo accesible

El botón de accesibilidad permite usar texto más grande, alto contraste, controles amplios y lectura en voz alta. Está disponible para facilitar el uso del sistema por distintas personas.

### Navegación por voz

En navegadores compatibles se pueden usar comandos de voz para navegar, buscar productos y abrir funciones disponibles para el rol actual. Acepta el permiso de micrófono cuando se solicite.

### Asistente virtual

El asistente puede orientar al cliente sobre productos, categorías e instrucciones y ayudar a navegar a una pantalla del sistema. No sustituye la validación de pagos, stock, garantías ni decisiones de administración.

> [IMAGEN: Accesibilidad y asistente virtual]

## 11. Problemas frecuentes

| Situación | Posible causa | Acción recomendada |
|---|---|---|
| No se puede iniciar sesión | Credenciales incorrectas, cuenta inactiva o sesión vencida | Revisa el correo; solicita apoyo al administrador. |
| No aparece un producto | Está oculto, sin stock o no coincide con el filtro | Busca por nombre, limpia filtros o consulta a administración. |
| No se puede cobrar | Pedido anulado, sesión vencida o conexión sin backend | Actualiza la pantalla, inicia sesión nuevamente y verifica conexión. |
| No aparece envío en despacho | No fue asignado al conductor o no es entrega a domicilio | Pide al administrador revisar Repartidores. |
| No carga la ruta | El pedido no tiene coordenadas o no hay internet | Verifica la dirección; usa Abrir Maps como alternativa. |
| Aparece “Ruta no encontrada” al editar personal | El frontend apunta a una API que no contiene la ruta de personal | Verifica que la URL de API corresponda al backend Express publicado. |

## Cierre

Para una operación segura, cada usuario debe trabajar únicamente con las opciones de su rol, verificar la información antes de confirmar y cerrar su sesión cuando termine. Para problemas que afecten pagos, cuentas, stock o datos de clientes, comunícate con el administrador de TERRA La Feria.

