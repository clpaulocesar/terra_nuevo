# Guía funcional · TERRA Autoservicio

## 1. Propósito del sistema

TERRA Autoservicio es una plataforma de consulta y venta de muebles, colchones y productos relacionados. Está pensada para usarse desde una pantalla de autoservicio, una computadora, tablet o celular.

## Accesos de demostración interna

> **Uso interno solamente.** Estas credenciales permiten mostrar las vistas del sistema. No deben compartirse con clientes finales, publicarse en internet ni incluirse en material público.

| Tipo de acceso | Correo | Contraseña |
| --- | --- | --- |
| Administrador | `admin@terra.local` | `TerraAdmin2026!` |
| Cliente mayorista | `ana@gmail.com` | `123456789` |

La cuenta mayorista de demostración permite validar el catálogo, los precios mayoristas, el carrito y el flujo de pedido asociado a la cuenta.

El sistema tiene tres experiencias principales:

| Tipo de usuario | Para qué sirve |
| --- | --- |
| Cliente minorista | Consulta productos y genera un ticket para pagar en caja, sin crear una cuenta. |
| Cliente mayorista | Inicia sesión, visualiza precios mayoristas y compra con su cuenta comercial. |
| Administrador | Gestiona catálogo, precios, clientes, pedidos y ventas directas. |

> El pago no se cobra automáticamente en la pantalla del cliente. El ticket se presenta o se paga en caja mediante efectivo, QR Simple o tarjeta, según la atención de la sucursal.

---

## 2. Vistas públicas del cliente

### Inicio

La página de inicio presenta la marca TERRA, promociones visuales y accesos rápidos a:

- Catálogo de productos.
- Carrito de compras.
- Inicio de sesión mayorista.
- Asistente virtual.

Desde cualquier vista se puede volver al inicio, revisar el carrito o abrir el catálogo.

### Catálogo de productos

El catálogo muestra los productos disponibles con imagen, nombre, categoría, disponibilidad, precio y acciones de compra.

El cliente puede:

- Buscar productos por nombre o descripción.
- Filtrar por categoría.
- Ordenar los resultados.
- Ver disponibilidad en tienda.
- Abrir el detalle de cada producto.
- Agregar productos al carrito.
- Escanear códigos QR para armar una compra.

Los precios y la disponibilidad se obtienen del catálogo administrado por TERRA. Si un producto no tiene unidades disponibles, no puede agregarse como compra normal.

### Detalle de producto

Cada ficha incluye, cuando la información está disponible:

- Galería de imágenes y video.
- Nombre, precio y disponibilidad.
- Descripción y características.
- Categoría, medidas y garantía.
- Colores o variantes disponibles.
- Selector de cantidad.
- Botón para agregar al carrito.
- Productos relacionados.

El cliente puede revisar la ficha antes de decidir su compra. La cantidad no puede superar el stock disponible.

### Carrito

El carrito concentra los productos elegidos. Muestra:

- Imagen, nombre, categoría y color seleccionado.
- Precio por unidad.
- Cantidad de cada producto.
- Subtotal y total estimado.
- Medios de pago aceptados en caja.

Desde aquí se puede aumentar o disminuir cantidades, eliminar una línea, vaciar el carrito, continuar con el pedido o volver a comprar.

---

## 3. Compra de cliente minorista

El cliente minorista no requiere registro ni contraseña.

### Paso 1: seleccionar productos

1. Ingresa al catálogo.
2. Busca o filtra productos.
3. Revisa el detalle si lo necesita.
4. Agrega uno o varios productos al carrito.

### Paso 2: identificación para el ticket

Al continuar desde el carrito, el sistema solicita:

- Nombre y apellidos.
- Teléfono o WhatsApp.
- NIT, si corresponde.

También aparece la opción **“Deseo recibir mi comprobante por WhatsApp”**. Si el cliente la activa, el teléfono es obligatorio porque se utiliza como referencia para que TERRA envíe el comprobante.

Estos datos se usan para el pedido actual. En la pantalla compartida no quedan guardados como una sesión personal.

### Paso 3: confirmación

La pantalla de confirmación permite revisar:

- Datos del cliente.
- Productos y cantidades.
- Subtotal y total.
- Modalidad de pago en caja.

Al presionar **“Confirmar y generar pedido”**, el sistema:

1. Comprueba nuevamente que los productos existan y tengan stock.
2. Calcula el total con los precios vigentes de TERRA.
3. Crea un código único de pedido.
4. Genera el ticket.

### Ticket generado

El ticket muestra el código del pedido, el resumen de productos y el importe a pagar. El cliente puede descargarlo como imagen y presentarlo al cajero.

Después de generar el pedido, el carrito y los datos temporales del cliente se limpian para proteger la privacidad en un equipo compartido.

---

## 4. Compra mediante código QR

El sistema admite dos formas de usar QR:

### Escaneo desde catálogo

1. El cliente presiona **“Comprar por QR”**.
2. Autoriza el uso de la cámara.
3. Escanea el QR de uno o varios productos TERRA.
4. Ve la compra QR acumulada y puede confirmar los productos.
5. Los productos se incorporan al carrito para continuar con el proceso normal.

Durante el escaneo, el sistema muestra el número de productos, unidades y el total estimado de la compra QR. El cliente puede seguir escaneando, abrir el detalle del último producto identificado, eliminar un producto de la lista o confirmar la compra QR cuando esté conforme.

### Ficha abierta desde un QR

Un QR de producto abre su ficha individual. Desde ella se puede ver el detalle y agregar ese artículo a la compra QR.

La ficha rápida por QR muestra datos actualizados desde el catálogo: imagen, nombre, categoría, precio, disponibilidad y descripción. Además permite revisar el resumen de la compra QR, seleccionar cualquiera de los productos acumulados, eliminarlo y volver a abrir la cámara para seguir comprando.

La compra QR conserva solamente las líneas de producto durante el proceso. No guarda nombres, teléfonos ni otros datos personales del cliente.

---

## 5. Comprobante por WhatsApp

Tras generar el ticket, el cliente que eligió recibir comprobante por WhatsApp puede usar el botón **“Enviar ticket a WhatsApp TERRA”**.

El botón abre WhatsApp con un mensaje preparado para el equipo de TERRA. El mensaje incluye:

- Código de pedido.
- Nombre del cliente.
- WhatsApp del cliente, cuando fue proporcionado.
- Lista de productos y cantidades.
- Total del pedido.
- Solicitud de envío del comprobante.

El mensaje se dirige al número oficial configurado para comprobantes de TERRA. Actualmente se configura desde el proyecto, por lo que el número puede actualizarse sin modificar la experiencia del cliente.

> Importante: este flujo prepara la solicitud al equipo de TERRA. El envío final del comprobante al cliente se realiza desde WhatsApp por el personal autorizado.

---

## 6. Asistente virtual

El botón flotante **“Asistente”** está disponible en las vistas del cliente. Al abrirlo aparece una conversación con el **Asistente TERRA**, un campo para escribir consultas y un indicador mientras se prepara la respuesta.

El cliente puede usarlo para pedir orientación sobre:

- Productos, líneas y características.
- Disponibilidad o formas de consultar un producto.
- Uso del catálogo, QR, carrito y ticket.
- Modalidades de pago en caja.
- Orientación inicial antes de comunicarse con un asesor.

La conversación se mantiene solo mientras la vista está abierta en el equipo compartido. Al cerrar o reiniciar el kiosco no se conserva como un perfil personal del comprador.

El asistente es un canal de orientación; no reemplaza la confirmación de precio, stock, pago, despacho o garantías por parte de la sucursal. Cuando el cliente requiere atención personalizada puede usar las opciones de contacto con un asesor TERRA.

---

## 7. Cliente mayorista

### Acceso a cuenta

El cliente mayorista se registra previamente por el equipo administrador. No existe un registro público desde la pantalla de compra.

En el encabezado, el cliente presiona **“Iniciar sesión”** e ingresa:

- Correo electrónico.
- Contraseña proporcionada por TERRA.

El modal también muestra una opción para comunicarse por WhatsApp con un asesor cuando una persona desea información para ser mayorista.

### Qué cambia al iniciar sesión

Cuando se valida una cuenta mayorista:

- El botón del encabezado pasa de “Iniciar sesión” al nombre del cliente.
- Se muestra un menú de cuenta con nombre, correo, teléfono, tipo de cuenta y opción para cerrar sesión.
- El catálogo muestra el precio mayorista en los productos que tengan un precio mayorista definido.
- La ficha de producto y el carrito usan el precio mayorista.
- El cliente puede comprar varios productos y cantidades según stock.
- Se omite la pantalla de identificación, porque el pedido se vincula a su cuenta mayorista.

Si un producto no tiene un precio mayorista definido, el sistema utiliza su precio público como referencia.

### Pedido mayorista

El mayorista revisa el carrito y continúa directamente a confirmación. El pedido queda asociado a su cuenta comercial.

Antes de crear el pedido, el sistema valida la sesión y vuelve a calcular el precio y stock desde la base de datos. Por ello, el importe final siempre usa las condiciones vigentes y no un valor alterado desde el navegador.

### Cerrar sesión

Desde el menú con su nombre, el mayorista puede cerrar sesión. Al hacerlo:

- Se vuelve al inicio.
- Se ocultan los precios mayoristas.
- El catálogo recupera precios minoristas.
- La sesión no queda almacenada en el equipo compartido.

### Historial de pedidos mayorista

El sistema cuenta con la base segura para consultar únicamente los pedidos de la cuenta mayorista autenticada. La vista **“Mis pedidos”** está destinada a mostrar:

- Código de ticket.
- Fecha.
- Productos adquiridos.
- Total.
- Estado del pedido.

La consulta está protegida: una cuenta mayorista no puede ver los pedidos de otra cuenta.

---

## 8. Administración

El acceso administrativo está separado de la experiencia del cliente. Solo usuarios autorizados pueden ingresar al panel de administración.

### Dashboard

Es la pantalla inicial del administrador. Resume indicadores operativos y ayuda a revisar el estado general de pedidos, productos y actividad comercial.

### Pedidos

Permite consultar los pedidos generados por clientes y sus estados. El equipo puede revisar:

- Código de pedido.
- Cliente asociado, si fue identificado.
- Productos solicitados.
- Total.
- Fecha.
- Estado de preparación o entrega.

Los estados operativos permiten acompañar el proceso desde la creación hasta la finalización, cancelación o entrega.

### Productos

Desde Productos el administrador puede:

- Crear nuevos productos.
- Editar productos existentes.
- Definir nombre, descripción, categoría y medidas.
- Subir o indicar imágenes y galería.
- Agregar video, colores y datos de ficha técnica.
- Definir precio público.
- Definir precio mayorista opcional.
- Ajustar stock o disponibilidad.
- Activar u ocultar productos del catálogo.
- Generar el QR para abrir la ficha de un producto.

El precio mayorista es visible solo durante una sesión mayorista válida.

### Categorías

Permite mantener las categorías con las que el cliente explora el catálogo. Una categoría correctamente configurada mejora la búsqueda y el orden de los productos.

### Clientes

La administración de clientes permite revisar los registros creados por pedidos y distinguir el tipo de cliente.

Para crear una cuenta mayorista, el administrador registra:

- Nombre completo.
- Correo electrónico.
- Celular, opcional.
- NIT, opcional.
- Contraseña temporal.

El sistema crea su ficha de cliente y su acceso como mayorista. La contraseña debe compartirse de forma segura con el cliente.

### Ventas directas

El módulo **Ventas directas** sirve para registrar una venta asistida desde administración, por ejemplo realizada por un vendedor en la sucursal.

Permite:

- Buscar productos y ver sus imágenes.
- Añadir varios productos y ajustar cantidades.
- Elegir un cliente registrado o atender a un cliente nuevo.
- Identificar si se aplica precio minorista o mayorista asistido.
- Elegir medio de pago: efectivo, QR o tarjeta.
- Cobrar y registrar la venta.

Si se selecciona un cliente mayorista registrado, se aplica su condición mayorista. Para un cliente nuevo, el personal puede seleccionar atención mayorista asistida y después crearle una cuenta desde Clientes si corresponde.

### Gestión de administradores

El panel contempla un módulo para preparar la creación de otros administradores. Su activación definitiva depende de la configuración de roles y permisos aprobada para la base de datos. Mientras tanto, solo deben usar el panel las personas autorizadas por TERRA.

### Cerrar sesión administrativa

Al cerrar sesión en administración, el sistema redirige al inicio de la experiencia de cliente.

---

## 9. Seguridad y privacidad

- Los clientes minoristas pueden comprar sin crear una cuenta.
- Los datos ingresados para una compra se usan para ese pedido y no se conservan en la tablet como una sesión personal.
- Las cuentas mayoristas se validan antes de mostrar su precio o crear su pedido.
- Un pedido siempre valida precio y stock en el servidor antes de registrarse.
- Las cuentas mayoristas solo pueden consultar información asociada a su propia cuenta.
- El administrador debe usar credenciales seguras y cerrar sesión al terminar su turno.

---

## 10. Resumen rápido de recorridos

### Minorista

`Inicio → Catálogo → Detalle opcional → Carrito → Identificación → Confirmación → Ticket → Pago en caja`

### Minorista con QR

`Escanear QR → Compra QR → Carrito → Identificación → Confirmación → Ticket → Pago en caja`

### Mayorista

`Inicio → Iniciar sesión → Catálogo con precio mayorista → Carrito → Confirmación → Ticket asociado a cuenta → Pago/atención en caja`

### Administrador

`Inicio de sesión admin → Dashboard → Productos / Categorías / Clientes / Pedidos / Ventas directas → Cerrar sesión`

---

## 11. Recomendaciones para la operación diaria

1. Mantener actualizados precio, precio mayorista, stock e imágenes de cada producto.
2. Verificar que cada producto visible tenga categoría y datos suficientes para que el cliente lo pueda identificar.
3. Usar el QR de cada producto físico para vincular showroom y catálogo digital.
4. Confirmar en caja el código de ticket, importe y disponibilidad antes de despachar.
5. Atender las solicitudes de comprobante de WhatsApp desde el número oficial de TERRA.
6. Crear cuentas mayoristas solo después de validar los datos comerciales del cliente.
7. Cerrar la sesión mayorista o administrativa al terminar de usar una pantalla compartida.
