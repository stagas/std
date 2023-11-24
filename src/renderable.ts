// log.active
import { $, flag, fx, of, when, whenNot } from 'signal'
import { randomHex } from 'utils'
import { Canvas } from './canvas.ts'
import { mergeRects } from './clip.ts'
import { Dirty } from './dirty.ts'
import { FixedArray } from './fixed-array.ts'
import { Point } from './point.ts'
import { Rect } from './rect.ts'
import { Scene } from './scene.ts'
import { traverse } from './traverse.ts'

const tempPoint = $(new Point)

const enum Debug {
  None = 0,
  Redraw /**/ = 1 << 0,
  All = 127
}

export abstract class Renderable {
  debug = Debug.Redraw

  static traverse(its: Renderable.It[]) {
    return traverse('renderable', its as any)
  }
  get its(): Renderable.It[] | undefined { return }
  get flatIts() {
    return [...Renderable.traverse(this.its ?? [])]
  }

  canDirectDraw?: boolean
  fillClear?: string
  clearBeforeRender = true
  noBelowRedraw = false
  clipContents = false
  scroll?: $<Point>
  offset?: $<Point>
  public init?(c: CanvasRenderingContext2D): void
  public draw?(c: CanvasRenderingContext2D, point: Point): void

  constructor(
    public it: Renderable.It,

    public renders = true,

    public rect = renders ? $(new Rect) : it.ctx.world.canvas!.rect,
    public canvas = renders ? $(new Canvas(it.ctx.world, rect)) : it.ctx.world.canvas!,

    public pr = it.ctx.world.screen.$.pr,
    public prRecip = it.ctx.world.screen.$.prRecip,
  ) { }

  dt = 1

  index = -1

  _view = $(new Rect)
  get view() {
    $()
    return this.renders
      ? this._view.hasSize
        ? this._view
        : this._view.set(this.rect) as $<Rect>
      : this._view
  }

  copyView?: Rect
  @fx update_from_copyView() {
    const { copyView, view } = of(this)
    const { x, y, w, h } = copyView
    $()
    view.set(copyView)
  }
  copySize?: Point
  @fx update_from_copySize() {
    const { copySize, view } = of(this)
    const { w, h } = copySize
    $()
    view.size.setParameters(w, h)
  }

  layout = $(new Point)

  need = Renderable.Need.Idle
  needInit = flag(this, 'need', Renderable.Need.Init)
  needDraw = flag(this, 'need', Renderable.Need.Draw)
  needRender = flag(this, 'need', Renderable.Need.Render)

  op = Renderable.Op.Idle
  opClear = flag(this, 'op', Renderable.Op.Clear)
  opPaint = flag(this, 'op', Renderable.Op.Paint)
  opDirect = flag(this, 'op', Renderable.Op.Direct)

  state = Renderable.State.Idle
  didInit = flag(this, 'state', Renderable.State.Init)
  didDraw = flag(this, 'state', Renderable.State.Draw)
  didRender = flag(this, 'state', Renderable.State.Render)
  isVisible = flag(this, 'state', Renderable.State.Visible)
  isHidden = flag(this, 'state', Renderable.State.Hidden)

  get shouldInit() {
    return Boolean(this.init && (
      (this.renders && !this.didDraw)
      || !this.didInit
      || this.needInit
    ))
  }
  get shouldClear() {
    return this.renders && (this.didDraw && (
      this.opClear
      || this.shouldPaint
      || !this.isVisible
      || this.isHidden
    ))
  }
  get shouldRender() {
    return this.renders && (!this.didRender || this.needRender)
  }
  get shouldPaint() {
    return this.renders && this.isVisible && (
      this.opPaint || !this.didDraw || this.needDraw || this.needRender)
  }
  clearBefore(c: CanvasRenderingContext2D) {
    this.dirtyBefore.view.clear(c)
    this.didDraw = false
  }
  clearNext(c: CanvasRenderingContext2D) {
    this.dirtyNext.view.clear(c)
  }
  dirtyBefore = $(new Dirty(this))
  dirtyNext = $(new Dirty(this))
  redraws = $(new FixedArray<Rect>)
  redrawIntersectionRect(c: CanvasRenderingContext2D, rect: Rect) {
    const { pr, dirtyBefore: dirty } = this
    dirty.redrawIntersectionRect(rect, c, pr)

    if (this.debug & Debug.Redraw) {
      rect.stroke(c, '#' + randomHex())
    }
  }
  redraw(c: CanvasRenderingContext2D) {
    const { redraws } = this
    for (const rect of mergeRects(redraws.array, redraws.count).values()) {
      this.redrawIntersectionRect(c, rect)
    }
  }
  render() {
    // if (this.draw) {
    const { rect, canvas, clearBeforeRender } = this

    // if (clearBeforeRender) {
    rect.clear(canvas.c)
    // }
    this.draw!(canvas.c, tempPoint.zero())
    // }
    this.didRender = true
    this.needRender = false
  }
  paint(c: CanvasRenderingContext2D) {
    const { dirtyNext } = this
    // try {
      this.didDraw = true
      this.needDraw = false
      this.opPaint = false

      if (this.opDirect) {
        this.opDirect = false
        if (this.canDirectDraw) {
          c.save()
          this.didRender = false
          this.init?.(c)
          this.draw!(c, tempPoint.set(dirtyNext.view.pos))
          c.restore()
          return this.dirtyNext.view
        }
      }

      if (this.shouldRender) {
        this.render()
      }

      this.paintRendered(c)
      return this.dirtyNext.view
    // }
    // finally {
    //   this.dirtyNext = this.dirtyBefore
    //   this.dirtyBefore = dirtyNext
    // }
  }
  paintRendered(c: CanvasRenderingContext2D) {
    this.dirtyNext.rect.drawImageTranslated(
      this.canvas.el,
      c,
      this.pr,
      true,
      this.dirtyNext.origin,
    )
  }
  @fx trigger_draw_on_dirty_origin() {
    const { dirtyNext } = this
    const { origin } = dirtyNext
    const { x, y } = origin
    $()
    if (this.didDraw) {
      this.needDraw = true
      return
    }
  }
  @fx trigger_init_on_first__() {
    const { didRender } = whenNot(this)
    const { isVisible } = when(this)
    $()
    this.needInit = true
  }
  @fx update_rect_on_resize_view__() {
    // const { renders } = when(this)
    const { w, h } = this.view
    $()
    this.rect.w = Math.max(this.rect.w, w)
    this.rect.h = Math.max(this.rect.h, h)
    if (this.didRender) this.needRender = true
  }
  @fx trigger_init_and_draw_on_resize__() {
    const { renders, pr } = when(this)
    const { w, h } = this.rect
    $()
    this.needInit = true
    if (this.didRender) this.needRender = true
    if (this.didDraw) this.needDraw = true
  }
  @fx trigger_draw_on_move__() {
    const { renders } = when(this)
    const { x, y } = this.view
    $()
    if (this.didDraw) {
      this.needDraw = true
      return
    }
  }
  // @fx trigger_draw_on_isHidden__() {
  //   const { renders } = when(this)
  //   const { isHidden } = this
  //   $()
  //   if (this.didDraw) {
  //     this.needDraw = true
  //     return
  //   }
  // }
}

export namespace Renderable {
  export interface It extends Scene {
    renderable: Renderable
  }
  export const enum Op {
    Idle = 0,
    Direct /* */ = 1 << 0,
    Paint /*  */ = 1 << 1,
    Clear /*  */ = 1 << 2,
  }
  export const enum Need {
    Idle = 0,
    Init /*   */ = 1 << 0,
    Draw /*   */ = 1 << 1,
    Render /* */ = 1 << 2,
  }
  export const enum State {
    Idle = 0,
    Init /*   */ = 1 << 0,
    Draw /*   */ = 1 << 1,
    Render /* */ = 1 << 2,
    Visible /**/ = 1 << 3,
    Hidden /* */ = 1 << 4,
  }
}
