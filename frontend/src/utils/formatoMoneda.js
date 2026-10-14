const formato = new Intl.NumberFormat('es-BO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatoMoneda(valor) {
  const numero = Number(valor);
  return `Bs ${formato.format(Number.isFinite(numero) ? numero : 0)}`;
}