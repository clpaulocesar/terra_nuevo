import { CarritoProvider } from './context/CarritoContext.jsx';
import { ClienteProvider } from './context/ClienteContext.jsx';
import AppRoutes from './routes/AppRoutes.jsx';

export default function App() {
  return (
    <ClienteProvider>
      <CarritoProvider>
        <AppRoutes />
      </CarritoProvider>
    </ClienteProvider>
  );
}