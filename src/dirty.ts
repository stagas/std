// log.active
import { $, fn } from 'signal'
import { Point } from './point.ts'
import { Rect } from './rect.ts'
import { Renderable } from './renderable.ts'
import { FixedArray } from './fixed-array.ts'

let testRect1: $<Rect>
let testRect2: $<Rect>

export class Dirty {
  constructor(
    public owner: Renderable,
    public rect = $(new Rect)
  ) { }
  index = -1
  scroll = $(new Point)
  nextScroll = $(new Point)
  redrawing = $(new FixedArray<Rect>)
  @fn overlapWith(other: Dirty) {
    testRect1 ??= $(new Rect)
    testRect2 ??= $(new Rect)
    return testRect1
      .set(this.rect)
      .translateByPos(this.scroll)
      .intersectionRect(
        testRect2.set(other.rect)
          .translateByPos(other.scroll)
      )
  }
  @fn redrawOverlap(
    other: Dirty,
    c: CanvasRenderingContext2D,
    pr: number,
    scroll: Point) {
    return this.overlapWith(other)
      ?.drawImageNormalizePosTranslated(
        other.owner.canvas.el,
        c,
        pr,
        testRect1.set(other.rect)
          .translateByPos(other.scroll),
        scroll
      )
  }
  @fn clear(c: CanvasRenderingContext2D) {
    testRect1 ??= $(new Rect)
    return testRect1.set(this.rect)
      .translateByPos(this.scroll)
      .clear(c)
  }
  @fn fill(c: CanvasRenderingContext2D, color: string) {
    testRect1 ??= $(new Rect)
    return testRect1.set(this.rect)
      .translateByPos(this.scroll)
      .fill(c, color)
  }
  @fn stroke(c: CanvasRenderingContext2D, color: string) {
    testRect1 ??= $(new Rect)
    return testRect1.set(this.rect)
      .translateByPos(this.scroll)
      .stroke(c, color)
  }
}
