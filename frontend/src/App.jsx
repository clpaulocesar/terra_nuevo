import { CarritoProvider } from './context/CarritoContext.jsx';
import { ClienteProvider } from './context/ClienteContext.jsx';
import { SesionClienteProvider } from './context/SesionClienteContext.jsx';
import { CatalogoProvider } from './context/CatalogoContext.jsx';
import { TemaProvider } from './context/TemaContext.jsx';
import AppRoutes from './routes/AppRoutes.jsx';

export default function App() {
  return (
    <TemaProvider><SesionClienteProvider><ClienteProvider><CarritoProvider><CatalogoProvider><AppRoutes /></CatalogoProvider></CarritoProvider></ClienteProvider></SesionClienteProvider></TemaProvider>
  );
}
