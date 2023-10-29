// log.active
import { fn } from 'signal'
import { Point } from '../src/point.ts'
import { Rect } from '../src/rect.ts'

export class Walls {
  constructor(public that: Rect) { }

  @fn update(it: { vel: Point, impactAbsorb: number, left: number, right: number, bottom: number, mass: number }) {
    const { that } = this

    if (it.vel.y < 1 && it.bottom === that.bottom) {
      return true
    }

    let d = it.bottom - that.bottom

    if (d > 0) {
      it.bottom = that.bottom
      it.vel.y = -it.vel.y * it.impactAbsorb
    }
    // else if (d > -1.5 && Math.abs(it.vel.y) < 1.5) {
    //   it.vel.y = 0
    //   it.bottom = that.bottom
    // }

    d = that.left - it.left

    if (d > 0) {
      it.left = that.left
      it.vel.x = -it.vel.x * it.impactAbsorb
    }
    else {

      d = it.right - that.right

      if (d > 0) {
        it.right = that.right
        it.vel.x = -it.vel.x * it.impactAbsorb
      }
    }
  }
}
