# TERRA Global

Sitio público independiente de TERRA, preparado para desplegarse como una sola
aplicación estática en Vercel. No depende del kiosco, del backoffice ni del
backend.

## Desarrollo

```bash
npm install
npm run dev
```

## Despliegue en Vercel

Al importar el repositorio, configura `frontend-global` como **Root Directory**.
Vercel detecta Vite automáticamente: el comando de compilación es `npm run build`
y el directorio de salida es `dist`. Define también `VITE_API_URL` con la URL
pública del backend terminada en `/api`; así el inicio usa los productos que el
administrador publique.

La portada representa una única presencia web global. El registro de clientes
minoristas, detalle de producto, carrito y pedidos se implementarán como las
siguientes pantallas del sitio.
