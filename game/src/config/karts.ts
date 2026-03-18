export interface KartDef {
  id: string
  name: string
  speed: number   // pixels per second
  price: number   // in-game money
  sheet: 'players' | 'enemies'
  spriteFrame: number
  tint?: number   // optional Phaser tint (hex)
}

export const KART_CATALOG: KartDef[] = [
  { id: 'default',        name: 'Sand Buggy',      speed: 150, price:   0, sheet: 'players', spriteFrame:  0 },
  { id: 'dune_runner',    name: 'Dune Runner',     speed: 180, price:  50, sheet: 'players', spriteFrame:  4 },
  { id: 'cactus_cruiser', name: 'Cactus Cruiser',  speed: 210, price: 120, sheet: 'players', spriteFrame:  8 },
  { id: 'oasis_racer',    name: 'Oasis Racer',     speed: 240, price: 200, sheet: 'players', spriteFrame: 12 },
  { id: 'desert_storm',   name: 'Desert Storm',    speed: 280, price: 350, sheet: 'enemies', spriteFrame:  0, tint: 0xff4444 },
]

export function getKart(id: string): KartDef {
  return KART_CATALOG.find(k => k.id === id) ?? KART_CATALOG[0]
}
