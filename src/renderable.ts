// log.active
import { $, flag, fx, nu, of, when, whenNot } from 'signal'
import { Animable } from './animable.ts'
import { Canvas } from './canvas.ts'
import { Point } from './point.ts'
import { Rect } from './rect.ts'
import { Scene } from './scene.ts'
import { TraverseOp } from './traverse.ts'

export type RenderTraverseOp = [op: TraverseOp, it: Renderable.It]

const tempPoint = $(new Point)

const enum Debug {
  None = 0,
  Redraw /**/ = 1 << 0,
  All = 127
}

export abstract class Renderable {
  debug = Debug.Redraw
  parent?: Renderable.It
  get its(): Renderable.It[] | undefined { return }
  get visibleIts() {
    return this.its?.filter(it => it.renderable.isVisible)
  }
  get flatIts(): Renderable.It[] {
    return [...(this.visibleIts ?? []).flatMap(it =>
      [it, ...it.renderable.flatIts])]
  }
  canDirectDraw?: boolean
  clipContents = false
  copyView?: Rect
  copySize?: Point
  copyRect?: boolean
  offset?: $<Point>
  scroll?: $<Point>
  layout?: $<Point>
  dt = 1
  index = -1
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
  needInit = false
  needDraw = false
  needRender = false
  needLayout = false
  didInit = false
  didDraw = false
  didRender = false
  isHidden = false
  _origin = $(new Point)
  get origin() {
    const { parent } = this
    if (!parent) return this._origin
    const {
      origin: { x: ox, y: oy },
      layout,
      scroll
    } = parent.renderable
    if (scroll) {
      const { x: sx, y: sy } = scroll
      if (layout) {
        const { x: lx, y: ly } = layout
        $()
        this._origin.setParameters(
          Math.round(ox + lx + sx),
          Math.round(oy + ly + sy),
        )
      }
      else {
        $()
        this._origin.setParameters(
          Math.round(ox + sx),
          Math.round(oy + sy),
        )
      }
    }
    else {
      if (layout) {
        const { x: lx, y: ly } = layout
        $()
        this._origin.setParameters(
          ox + lx,
          oy + ly,
        )
      }
      else {
        $()
        this._origin.setParameters(
          ox,
          oy,
        )
      }
    }
    return this._origin
  }
  _dirty = $(new Rect)
  get dirty() {
    const {
      view, view: { x, y, w, h },
      origin, origin: { x: ox, y: oy }
    } = this
    $()
    return this._dirty
      .set(view)
      .translateByPos(origin)
      .floorCeil() as $<Rect>
  }
  _view = $(new Rect)
  get view() {
    $()
    return this.renders
      ? this._view.hasSize
        ? this._view
        : this._view.set(this.rect) as $<Rect>
      : this._view
  }
  get visible() {
    const { render: { visible } } = of(this.it.ctx.world)
    return visible
  }
  _isSeen = false
  get isSeen() {
    if (this.isVisible) {
      this._isSeen = true
    }
    return this._isSeen
  }
  get isVisible(): boolean {
    if (this.isHidden) return false
    const { parent } = this
    if (parent) {
      if (!parent.renderable.isVisible) return false
      if (!parent.renderable.scroll) return parent.renderable.isVisible
    }
    const { it, view, view: { x, y, w, h }, origin: { x: ox, y: oy } } = this
    const { render } = it.ctx.world
    if (!render) return false
    $()
    render.visible.pos.setParameters(-ox, -oy)
    const isVisible = view.intersectsRect(render.visible)
    return isVisible
  }
  get shouldInit() {
    const { needInit, init, renders, didDraw, didInit } = this
    return needInit || Boolean(
      init && (!renders && !didInit)
      //   (renders && !didDraw)
      //   || !didInit
    )
  }
  get shouldRender() {
    return Boolean(this.renders && this.draw && (!this.didRender || this.needRender))
  }
  get canPaint() {
    const { isVisible, renders, draw } = this
    return Boolean(isVisible && renders && draw)
  }
  get shouldPaint() {
    const { didDraw, needRender, needDraw } = this
    return didDraw || needRender || needDraw
  }
  render() {
    const { rect, canvas } = this
    rect.clear(canvas.c)
    this.draw!(canvas.c, tempPoint.zero())
    this.didRender = true
    this.needRender = false
  }
  paint(c: CanvasRenderingContext2D, opDirect: boolean) {
    const { dirty } = this

    this.didDraw = true
    this.needDraw = false

    if (opDirect && this.canDirectDraw) {
      c.save()
      this.didRender = false
      this.init?.(c)
      this.draw!(c, tempPoint.set(dirty.pos))
      c.restore()
      return dirty
    }

    if (this.shouldRender) this.render()

    this.paintRendered(c)
    return dirty
  }
  paintRendered(c: CanvasRenderingContext2D) {
    this.dirty.drawImage(
      this.canvas.el,
      c,
      this.pr,
      true
    )
  }

  @fx set_its_parent__() {
    const { its, it: parent } = of(this)
    const { ctx: { world } } = of(parent)
    const { canvas } = of(world)
    $()
    for (const it of its) {
      it.renderable.parent = parent
    }
  }
  @fx update_from_copyView() {
    const { copyView, view } = of(this)
    const { x, y, w, h } = copyView
    $()
    view.set(copyView)
  }
  @fx update_from_copySize() {
    const { copySize, view } = of(this)
    const { w, h } = copySize
    $()
    view.size.setParameters(w, h)
  }
  @fx update_from_copyRect() {
    const { copyRect, view, rect } = when(this)
    const { w, h } = rect
    $()
    view.size.setParameters(w, h)
  }
  @fx maybe_init() {
    const { shouldInit } = when(this)
    $()
    const r = this
    r.init?.(r.canvas.c)
    r.didInit = true
    r.needInit = false
    if (r.renders) r.needDraw = true
    return true
  }

  // @fx trigger_init_on_first__() {
  //   const { didRender } = whenNot(this)
  //   // const { isVisible } = when(this)
  //   // const { hasSize } = when(this.view)
  //   $()
  //   this.needInit = true
  // }
  @fx trigger_draw_on_dirty_origin() {
    const { origin } = this
    const { x, y } = origin
    $()
    if (this.didDraw) {
      this.needDraw = true
      return
    }
  }
  @fx trigger_draw_on_isVisible() {
    const { isVisible } = this
    $()
    this.needDraw = true
  }
  @fx trigger_anim_on_scroll() {
    const { worldRender, scroll } = of(this)
    const { x, y } = scroll
    $()
    worldRender.animable.need |= Animable.Need.Draw
  }
  @fx update_rect_on_resize_view__() {
    const { renders } = when(this)
    const { w, h } = this.view
    $()
    $.batch(() => {
      $.flush()
      this.rect.w = Math.max(this.rect.w, w)
      this.rect.h = Math.max(this.rect.h, h)
      if (this.didRender) this.needRender = true
      $.flush()
    })
  }
  @fx trigger_init_and_draw_on_resize__() {
    const { renders, pr } = when(this)
    const { w, h } = this.rect
    $()
    $.flush()
    this.needInit = true
    if (this.didRender) this.needRender = true
    if (this.didDraw) this.needDraw = true
    $.flush()
  }
  @fx trigger_draw_on_move__() {
    const { renders } = when(this)
    const { x, y } = this.view
    $()
    // console.log('trigger', this.it.constructor.name)
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

  // OPT: get the refs for quicker access
  @nu get worldRender() {
    const { ctx: { world } } = this.it
    const { render } = of(world)
    return render
  }
  @nu get worldAnim() {
    const { ctx: { world } } = this.it
    const { anim } = of(world)
    return anim
  }
  @fx access_animable() {
    const { worldAnim, it } = of(this)
    it?.animable?.flatIts
  }
  @fx trigger_anim_draw__() {
    const { worldRender, isVisible, needDraw, needRender } = of(this)
    $()
    if (needDraw || needRender) {
      worldRender.animable.need |= Animable.Need.Draw
    }
  }
}

export namespace Renderable {
  export interface It extends Scene {
    renderable: Renderable
    animable?: Animable
  }
  export const enum Op {
    Idle = 0,
    Direct /*   1 */ = 1 << 0,
    Paint /*    2 */ = 1 << 1,
    Clear /*    4 */ = 1 << 2,
  }
  export const enum Need {
    Idle = 0,
    Init /*     1 */ = 1 << 0,
    Draw /*     2 */ = 1 << 1,
    Render /*   4 */ = 1 << 2,
    Layout /*   8 */ = 1 << 3,
  }
  export const enum State {
    Idle = 0,
    Init /*     1 */ = 1 << 0,
    Draw /*     2 */ = 1 << 1,
    Render /*   4 */ = 1 << 2,
    Visible /*  8 */ = 1 << 3,
    Hidden /*  16 */ = 1 << 4,
  }
}
