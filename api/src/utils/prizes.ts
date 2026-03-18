export const VALID_PRIZE_AMOUNTS = new Set([0, 10, 20, 30])

export function isValidPrize(amount: unknown): amount is number {
  return typeof amount === 'number' && VALID_PRIZE_AMOUNTS.has(amount)
}

export function prizeForPlace(place: number): number {
  if (place === 1) return 30
  if (place === 2) return 20
  if (place === 3) return 10
  return 0
}
