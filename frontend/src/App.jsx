import { CarritoProvider } from './context/CarritoContext.jsx';
import { ClienteProvider } from './context/ClienteContext.jsx';
import { SesionClienteProvider } from './context/SesionClienteContext.jsx';
import { CatalogoProvider } from './context/CatalogoContext.jsx';
import AppRoutes from './routes/AppRoutes.jsx';

export default function App() {
  return (
    <SesionClienteProvider><ClienteProvider><CarritoProvider><CatalogoProvider><AppRoutes /></CatalogoProvider></CarritoProvider></ClienteProvider></SesionClienteProvider>
  );
}
