export interface KartDef {
  name: string
  speed: number
  price: number
}

export const KART_CATALOG = new Map<string, KartDef>([
  ['default',        { name: 'Sand Buggy',    speed: 150, price: 0 }],
  ['dune_runner',    { name: 'Dune Runner',   speed: 180, price: 50 }],
  ['cactus_cruiser', { name: 'Cactus Cruiser',speed: 210, price: 120 }],
  ['oasis_racer',    { name: 'Oasis Racer',   speed: 240, price: 200 }],
  ['desert_storm',   { name: 'Desert Storm',  speed: 280, price: 350 }],
])

export function isValidCartId(id: unknown): id is string {
  return typeof id === 'string' && KART_CATALOG.has(id)
}

export function canAfford(money: number, cartId: string): boolean {
  const kart = KART_CATALOG.get(cartId)
  return kart !== undefined && money >= kart.price
}

export function alreadyOwns(ownedCarts: string[], cartId: string): boolean {
  return ownedCarts.includes(cartId)
}
