// log.active
import { $, fn } from 'signal'
import { Point } from '../src/point.ts'

const p = $(new Point)

export class Motion {
  coeff = 1
  @fn update(it: { vel: Point, pos: Point }) {
    const { vel, pos } = it
    vel.mul(0.98)
    // if (vel.absSum <= 1) return
    pos.add(p.set(vel).mul(this.coeff))
  }
}
