/**
 * Utilitários de formatação para valores financeiros
 */

/**
 * Formata um número para exibição com separadores de milhar
 * @param value - Valor numérico
 * @param decimals - Número de casas decimais (padrão: 2)
 * @returns String formatada para exibição
 */
export function formatPriceDisplay(value: number | string, decimals: number = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '0.00';
  
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Formata um número para armazenamento no banco (sem separadores)
 * @param value - Valor numérico
 * @param decimals - Número de casas decimais (padrão: 2)
 * @returns String no formato correto para Postgres
 */
export function formatPriceForDb(value: number | string, decimals: number = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '0';
  
  return num.toFixed(decimals);
}

/**
 * Remove formatação de uma string de preço
 * @param value - String com formatação (ex: "1.234,56" ou "1,234.56")
 * @returns Número sem formatação
 */
export function parsePriceString(value: string): number {
  // Remove tudo exceto dígitos, ponto e vírgula
  const cleaned = value.replace(/[^\d.,]/g, '');
  
  // Detecta se usa vírgula ou ponto como decimal
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  
  let normalized: string;
  
  if (lastComma > lastDot) {
    // Formato europeu (1.234,56)
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    // Formato americano (1,234.56)
    normalized = cleaned.replace(/,/g, '');
  }
  
  return parseFloat(normalized) || 0;
}

/**
 * Formata percentual para exibição
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

/**
 * Formata volume para exibição compacta
 */
export function formatVolume(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toFixed(0);
}
