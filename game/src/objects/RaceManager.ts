import { WAYPOINTS, FINISH_WAYPOINT_INDEX } from '../config/waypoints'

function prizeForPlace(place: number): number {
  return ({ 1: 30, 2: 20, 3: 10 } as Record<number, number>)[place] ?? 0
}

export const RACE_DURATION   = 90   // seconds
export const TOTAL_LAPS      = 2
export const CHECKPOINT_RADIUS = 48 // pixels

/** Compute a race score for position ranking (higher = further ahead). */
export function computeRaceScore(
  checkpointsPassed: number,
  distToNext: number,
  lap: number,
  totalWaypoints: number,
): number {
  return (lap * totalWaypoints + checkpointsPassed) * 100_000 - distToNext
}

/** Returns ordinal suffix string, e.g. 1 → "1st". */
export function ordinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}

/** Format seconds as "M:SS". */
export function formatTime(secs: number): string {
  const s = Math.max(0, Math.floor(secs))
  const m = Math.floor(s / 60)
  const rem = s % 60
  return `${m}:${rem.toString().padStart(2, '0')}`
}

export interface RacerState {
  id: string
  x: number
  y: number
  checkpointsPassed: number
  lap: number
  finished: boolean
  finishTime: number | null
  place: number
}

type RaceStatus = 'countdown' | 'racing' | 'finished'

export class RaceManager {
  status: RaceStatus = 'countdown'
  countdown = 3       // seconds remaining in countdown
  timeLeft  = RACE_DURATION
  racers: RacerState[] = []

  constructor(racerIds: string[]) {
    this.racers = racerIds.map(id => ({
      id,
      x: 0, y: 0,
      checkpointsPassed: 0,
      lap: 1,
      finished: false,
      finishTime: null,
      place: 0,
    }))
  }

  update(delta: number, racerPositions: { id: string; x: number; y: number }[]) {
    const dt = delta / 1000

    if (this.status === 'countdown') {
      this.countdown -= dt
      if (this.countdown <= 0) {
        this.countdown = 0
        this.status = 'racing'
      }
      return
    }

    if (this.status === 'finished') return

    this.timeLeft -= dt

    // Update racer positions & checkpoint detection
    for (const pos of racerPositions) {
      const state = this.racers.find(r => r.id === pos.id)
      if (!state || state.finished) continue
      state.x = pos.x
      state.y = pos.y

      // Check next checkpoint
      const nextWpIdx = state.checkpointsPassed % WAYPOINTS.length
      const wp = WAYPOINTS[nextWpIdx]
      const dx = pos.x - wp.x
      const dy = pos.y - wp.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < CHECKPOINT_RADIUS) {
        state.checkpointsPassed++
        // Lap completion: crossed the finish waypoint at the start of a new loop
        if (nextWpIdx === FINISH_WAYPOINT_INDEX && state.checkpointsPassed > WAYPOINTS.length) {
          state.lap++
          if (state.lap > TOTAL_LAPS) {
            state.finished = true
            state.finishTime = RACE_DURATION - this.timeLeft
          }
        }
      }
    }

    // Recalculate positions
    this._recalcPlaces()

    // End race if all finished or time ran out
    if (this.racers.every(r => r.finished) || this.timeLeft <= 0) {
      this.status = 'finished'
      // Any unfinished racers get positions based on current order
      this._recalcPlaces()
    }
  }

  private _recalcPlaces() {
    const sorted = [...this.racers].sort((a, b) => {
      if (a.finished && !b.finished) return -1
      if (!a.finished && b.finished) return 1
      const nextA = a.checkpointsPassed % WAYPOINTS.length
      const nextB = b.checkpointsPassed % WAYPOINTS.length
      const wpA = WAYPOINTS[nextA]
      const wpB = WAYPOINTS[nextB]
      const distA = Math.sqrt((a.x - wpA.x) ** 2 + (a.y - wpA.y) ** 2)
      const distB = Math.sqrt((b.x - wpB.x) ** 2 + (b.y - wpB.y) ** 2)
      const scoreA = computeRaceScore(a.checkpointsPassed, distA, a.lap, WAYPOINTS.length)
      const scoreB = computeRaceScore(b.checkpointsPassed, distB, b.lap, WAYPOINTS.length)
      return scoreB - scoreA
    })
    sorted.forEach((r, i) => { r.place = i + 1 })
  }

  getPlayerPlace(playerId: string): number {
    return this.racers.find(r => r.id === playerId)?.place ?? 0
  }

  getResults(): { id: string; place: number; finishTime: number | null; prize: number }[] {
    return this.racers.map(r => ({
      id: r.id,
      place: r.place,
      finishTime: r.finishTime,
      prize: prizeForPlace(r.place),
    }))
  }
}
