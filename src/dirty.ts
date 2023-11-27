// log.active
import { $, fn, fx } from 'signal'
import { Point } from './point.ts'
import { Rect } from './rect.ts'
import { Renderable } from './renderable.ts'

export class Dirty {
  constructor(
    public owner: Renderable,
    public rect = $(new Rect)
  ) { }
  origin = $(new Point)
  _view = $(new Rect)
  get view() {
    const { rect: { x, y, w, h }, origin: { x: ox, y: oy } } = this
    $()
    return this._view
      .set(this.rect)
      .translateByPos(this.origin)
      .floorCeil() as $<Rect>
  }
  @fx update_rect() {
    const { rect: r, owner: { view: { x, y, w, h } } } = this
    $()
    r.x = Math.floor(x)
    r.y = Math.floor(y)
    r.w = Math.ceil(w)
    r.h = Math.ceil(h)
  }
  // update() {
  //   const { rect: r, owner: { view: { x, y, w, h } } } = this
  //   r.x = Math.floor(x)
  //   r.y = Math.floor(y)
  //   r.w = Math.ceil(w)
  //   r.h = Math.ceil(h)
  //   return r
  //   //   .set(this.owner.view)
  //   //   .floorCeil() as $<Rect>
  //   // return this.rect
  //   //   .set(this.owner.view)
  //   //   .floorCeil() as $<Rect>
  // }
  redrawIntersectionRect(
    ir: Rect, c: CanvasRenderingContext2D, pr: number) {
    return ir.drawImageNormalizePos(
      this.owner.canvas.el,
      c,
      pr,
      this.view.pos,
    ) as $<Rect>
  }
}
