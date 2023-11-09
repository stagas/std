// log.active
import { $, fn } from 'signal'
import { Point } from './point.ts'
import { Rect } from './rect.ts'
import { Renderable } from './renderable.ts'

export class Dirty {
  constructor(
    public owner: Renderable,
    public rect = $(new Rect)
  ) { }
  scroll = $(new Point)
  _view = $(new Rect)
  get view() {
    const { rect: { x, y }, scroll: { x: sx, y: sy } } = this
    $()
    return this._view
      .set(this.rect)
      .translateByPos(this.scroll) as $<Rect>
  }
  @fn update() {
    return this.rect.set(this.owner.view) as $<Rect>
  }
  @fn redrawIntersectionRect(
    ir: Rect, c: CanvasRenderingContext2D, pr: number) {
    return ir.drawImageNormalizePos(
      this.owner.canvas.el,
      c,
      pr,
      this.view.pos,
    ) as $<Rect>
  }
}
