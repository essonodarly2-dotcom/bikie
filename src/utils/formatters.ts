export function formatXAF(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0 XAF';
  }
  const formatted = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted} XAF`;
}

export function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function getOrderStatusLabel(status: string): { label: string; bg: string; text: string } {
  switch (status) {
    case 'pending':
      return { label: 'Pendiente', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' };
    case 'confirmed':
      return { label: 'Confirmado', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' };
    case 'preparing':
      return { label: 'Preparando', bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700' };
    case 'ready_for_pickup':
      return { label: 'Listo para recoger', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' };
    case 'shipped':
      return { label: 'Enviado', bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700' };
    case 'delivered':
      return { label: 'Entregado', bg: 'bg-green-50 border-green-200', text: 'text-green-700' };
    case 'cancelled':
      return { label: 'Cancelado', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700' };
    default:
      return { label: status, bg: 'bg-slate-50 border-slate-200', text: 'text-slate-700' };
  }
}
