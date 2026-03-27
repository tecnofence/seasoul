/**
 * Utilitários de formatação para ENGERIS ONE
 */

/**
 * Formata um valor numérico para Kwanza angolano (AOA)
 * Exemplo: formatKwanza(1250000) => "1.250.000,00 AOA"
 */
export function formatKwanza(value: number): string {
  const fixed = value.toFixed(2);
  const [integerPart, decimalPart] = fixed.split('.');
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formattedInteger},${decimalPart} AOA`;
}

/**
 * Formata uma data para o formato português
 * Exemplo: formatDate(new Date()) => "27/03/2026"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formata data e hora para o formato português
 * Exemplo: formatDateTime(new Date()) => "27/03/2026 14:30"
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const datePart = formatDate(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${datePart} ${hours}:${minutes}`;
}
