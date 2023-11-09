import { $, fn, of } from 'signal'
import { Dirty } from './dirty.ts'
import { Rect } from './rect.ts'

export class Overlap {
  static create() {
    return $(new Overlap)
  }
  d1?: Dirty
  d2?: Dirty
  rect = $(new Rect)
  @fn update() {
    const { d1, d2 } = of(this)
    const overlap = d1.overlapWith(d2)
    if (overlap) {
      this.rect.set(overlap)
      return this.rect
    }
  }
}
