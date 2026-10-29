import { ShieldCheck } from 'lucide-react';

export default function NotaPrivacidad() {
  return (
    <aside
      className="mt-4 flex items-start gap-2.5 rounded-terra-campo border border-terra-borde bg-terra-superficie-2 px-4
        py-3.5 text-terra-texto-suave"
    >
      <ShieldCheck
        size={23}
        aria-hidden="true"
        className="flex-none text-terra-acento"
      />
      <p className="m-0 text-terra-sm">
        Tu privacidad está protegida. Solo utilizaremos tus datos para procesar este pedido.
      </p>
    </aside>
  );
}
