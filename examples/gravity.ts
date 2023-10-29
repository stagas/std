// log.active
import { fn } from 'signal'
import { Point } from '../src/point.ts'

export class Gravity {
  coeff = 1
  gravity = 9.8 * (1 / 60) * (80 / 5)
  @fn update(it: { vel: Point }) {
    it.vel.y += this.gravity * this.coeff
  }
}
