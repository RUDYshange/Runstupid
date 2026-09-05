/**
 * Display formatting only. Every total the user sees is computed on the server
 * and arrives already correct — these functions never do arithmetic that
 * changes a figure, because two implementations of the same sum eventually
 * disagree.
 */

const zar = new Intl.NumberFormat('en-ZA', {
  style: 'currency', currency: 'ZAR', maximumFractionDigits: 0
});

/** Full value, for ledgers and tables: R7 952 600 */
export const money = (n) => (n == null ? '—' : zar.format(n));

/** Abbreviated, for narrow summary strips: R7.95m */
export function moneyShort(n) {
  if (n == null) return '—';
  if (Math.abs(n) >= 1e6) return 'R' + (n / 1e6).toFixed(2) + 'm';
  if (Math.abs(n) >= 1e3) return 'R' + Math.round(n / 1e3) + 'k';
  return 'R' + Math.round(n);
}

/** 5 Sep 2026 — never 05/09/2026, which is ambiguous against the US order. */
export const date = (iso) => (iso
  ? new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
  : '—');

export function relativeDays(days) {
  if (days == null) return '';
  if (days < 0)  return `${Math.abs(days)} days late`;
  if (days === 0) return 'today';
  return `in ${days} days`;
}

/** Escapes anything that came from the database before it reaches innerHTML. */
export const esc = (s) => String(s ?? '')
  .replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
