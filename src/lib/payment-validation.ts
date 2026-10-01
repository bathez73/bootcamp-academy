export function validPayment(transaction: unknown, amount: unknown, expected: number): boolean {
 return typeof transaction === 'string' && /^[a-zA-Z0-9_-]{1,150}$/.test(transaction) && (typeof amount === 'number' || typeof amount === 'string' && amount.trim() !== '') && Number.isFinite(Number(amount)) && Number(amount) >= expected;
}
