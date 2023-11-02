// log.active
import { $ } from 'signal'
import { Point } from './point.ts'
import { Rect } from './rect.ts'
import { Renderable } from './renderable.ts'

export class Dirty {
  constructor(
    public owner: Renderable,
    public rect = $(new Rect)
  ) { }
  scroll = $(new Point)
  overlapWith(other: Dirty) {
    return this.rect.intersectionRect(other.rect)
  }
  redrawOverlap(
    other: Dirty,
    c: CanvasRenderingContext2D,
    pr: number) {
    return this.overlapWith(other)
      ?.drawImageNormalizePos(
        other.owner.canvas.el,
        c,
        pr,
        other.rect
      )
  }
  clear(c: CanvasRenderingContext2D) {
    return this.rect.clear(c)
  }
}
