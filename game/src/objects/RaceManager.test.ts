import { describe, it, expect } from 'vitest'
import { computeRaceScore, ordinalSuffix, formatTime, RaceManager, RACE_DURATION } from './RaceManager'
import { WAYPOINTS, FINISH_WAYPOINT_INDEX } from '../config/waypoints'

describe('computeRaceScore', () => {
  it('higher checkpoint count means higher score', () => {
    expect(computeRaceScore(5, 100, 0, 18)).toBeGreaterThan(computeRaceScore(3, 100, 0, 18))
  })

  it('smaller distance to next checkpoint means higher score (same checkpoint)', () => {
    expect(computeRaceScore(3, 20, 0, 18)).toBeGreaterThan(computeRaceScore(3, 200, 0, 18))
  })

  it('more laps means higher score', () => {
    expect(computeRaceScore(2, 100, 2, 18)).toBeGreaterThan(computeRaceScore(2, 100, 1, 18))
  })
})

describe('ordinalSuffix', () => {
  it.each([
    [1, '1st'], [2, '2nd'], [3, '3rd'], [4, '4th'],
    [11, '11th'], [12, '12th'], [13, '13th'],
  ])('%i → %s', (n, expected) => {
    expect(ordinalSuffix(n)).toBe(expected)
  })
})

describe('formatTime', () => {
  it('should format 90 seconds as 1:30', () => { expect(formatTime(90)).toBe('1:30') })
  it('should format 9 seconds as 0:09',  () => { expect(formatTime(9)).toBe('0:09') })
  it('should format 0 seconds as 0:00',  () => { expect(formatTime(0)).toBe('0:00') })
})

describe('RaceManager.update()', () => {
  const wp0 = WAYPOINTS[FINISH_WAYPOINT_INDEX]

  it('transitions from countdown to racing after 3+ seconds', () => {
    const mgr = new RaceManager(['p1'])
    expect(mgr.status).toBe('countdown')
    mgr.update(3001, [{ id: 'p1', x: 0, y: 0 }])
    expect(mgr.status).toBe('racing')
  })

  it('does not check checkpoints during countdown', () => {
    const mgr = new RaceManager(['p1'])
    mgr.update(500, [{ id: 'p1', x: wp0.x, y: wp0.y }])
    expect(mgr.racers[0].checkpointsPassed).toBe(0)
  })

  it('advances checkpointsPassed when player is within CHECKPOINT_RADIUS', () => {
    const mgr = new RaceManager(['p1'])
    mgr.status = 'racing' as never
    mgr.update(16, [{ id: 'p1', x: wp0.x, y: wp0.y }])
    expect(mgr.racers[0].checkpointsPassed).toBe(1)
  })

  it('does NOT trigger lap completion on first waypoint-0 crossing', () => {
    const mgr = new RaceManager(['p1'])
    mgr.status = 'racing' as never
    mgr.update(16, [{ id: 'p1', x: wp0.x, y: wp0.y }])
    expect(mgr.racers[0].lap).toBe(1)
  })

  it('increments lap after completing one full circuit', () => {
    const mgr = new RaceManager(['p1'])
    mgr.status = 'racing' as never
    const state = mgr.racers[0]
    // Simulate completing 18 checkpoints (full circuit, cp 0–17)
    state.checkpointsPassed = WAYPOINTS.length  // about to re-cross finish (wp 0)
    mgr.update(16, [{ id: 'p1', x: wp0.x, y: wp0.y }])
    expect(state.lap).toBe(2)
    expect(state.finished).toBe(false)
  })

  it('marks racer finished after 2 complete laps', () => {
    const mgr = new RaceManager(['p1'])
    mgr.status = 'racing' as never
    const state = mgr.racers[0]
    // Lap 1 complete
    state.checkpointsPassed = WAYPOINTS.length
    mgr.update(16, [{ id: 'p1', x: wp0.x, y: wp0.y }])
    expect(state.lap).toBe(2)
    // Lap 2 complete
    state.checkpointsPassed = WAYPOINTS.length * 2
    mgr.update(16, [{ id: 'p1', x: wp0.x, y: wp0.y }])
    expect(state.finished).toBe(true)
    expect(state.finishTime).not.toBeNull()
  })

  it('ends race when timer expires', () => {
    const mgr = new RaceManager(['p1'])
    mgr.status = 'racing' as never
    mgr.update(RACE_DURATION * 1000 + 1, [{ id: 'p1', x: 0, y: 0 }])
    expect(mgr.status).toBe('finished')
  })

  it('getResults returns prize for first place', () => {
    const mgr = new RaceManager(['p1', 'p2'])
    mgr.status = 'racing' as never
    const s1 = mgr.racers[0]
    const s2 = mgr.racers[1]
    // p1 ahead of p2
    s1.checkpointsPassed = 5
    s2.checkpointsPassed = 2
    mgr.update(16, [
      { id: 'p1', x: 9999, y: 9999 },
      { id: 'p2', x: 9999, y: 9999 },
    ])
    const results = mgr.getResults()
    const p1 = results.find(r => r.id === 'p1')!
    expect(p1.place).toBe(1)
    expect(p1.prize).toBe(30)
  })
})
