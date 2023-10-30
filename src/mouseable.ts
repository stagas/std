import { $ } from 'signal'
import { Mouse } from './mouse.ts'
import { Point } from './point.ts'
import { Renderable } from './renderable.ts'

export abstract class Mouseable {
  constructor(
    public it: Mouseable.It,
    public downCount = it.ctx.world.input.mouse.$.downCount,
    public downTime = it.ctx.world.input.mouse.$.downTime,
    public mouse = $({
      btns: it.ctx.world.pointer.$.buttons,
      wheel: it.ctx.world.pointer.$.wheel,
      pos: $(new Point),
      downPos: $(new Point)
    }),
  ) { }

  // settable by It
  abstract hitArea?: { isPointWithin(p: Point): boolean }
  canHover = true
  cursor = 'default'
  getItAtPoint(p: Point): Mouseable.It | false | undefined {
    return this.hitArea?.isPointWithin(p) && this.it
  }

  public onMouseEvent?(kind: Mouse.EventKind): true | undefined | void

  // internal
  isDown = false
  isFocused = false
  isHovering = false

  // @fx apply_pos() {
  //   const { pos } = this.it.ctx.world.pointer
  //   const { xy } = pos
  //   $()
  //   this.mouse.pos.set(xy)
  //   // const { mouse: { pos, downPos } } = of(this)
  //   // downPos.set(pos)
  // }

  // @fx apply_scroll() {
  //   const { scroll } = of(this.it.renderable)
  //   $()
  //   this.mouse.pos.sub(scroll)
  //   // const { mouse: { pos, downPos } } = of(this)
  //   // downPos.set(pos)
  // }

  // @fx apply_downPos() {
  //   const { isDown } = when(this)
  //   const { mouse: { pos } } = of(this)
  //   const { xy } = pos
  //   $()
  //   const { mouse: { downPos } } = of(this)
  //   downPos.set(xy)
  // }
}

export namespace Mouseable {
  export interface It extends Renderable.It {
    mouseables?: Mouseable.It[]
    mouseable: Mouseable
    renderable: Renderable
  }
}
