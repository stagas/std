import { $, fx, of, when } from 'signal'
import { Point } from './point.ts'
import { Mouse } from './mouse.ts'
import { Renderable } from './renderable.ts'

export abstract class Pointable {
  constructor(
    public it: Pointable.It,
    public downCount = it.ctx.world.input.mouse.$.downCount,
    public downTime = it.ctx.world.input.mouse.$.downTime,
    public mouse = $({
      btns: it.ctx.world.pointer.$.buttons,
      wheel: it.ctx.world.pointer.$.wheel,
      pos: $(new Point),
      // get pos() {
      //   return it.renderable.position === Renderable.Position.Fixed
      //     ? it.ctx.world.input.mouse.pos
      //     : it.ctx.world.input.mouse.pos //innerPos
      // },
      downPos: $(new Point)
    }),
  ) { }

  // settable by It
  abstract hitArea?: { isPointWithin(p: Point): boolean }
  canHover = true
  cursor = 'default'
  getItAtPoint(p: Point): Pointable.It | false | undefined {
    return this.hitArea?.isPointWithin(p) && this.it
  }

  public onMouseEvent?(kind: Mouse.EventKind): true | undefined | void

  // internal
  isDown = false
  isFocused = false
  isHovering = false

  @fx apply_pos() {
    const { pos } = this.it.ctx.world.pointer
    const { xy } = pos
    $()
    this.mouse.pos.set(xy)
    // const { mouse: { pos, downPos } } = of(this)
    // downPos.set(pos)
  }

  @fx apply_scroll() {
    const { scroll } = of(this.it.renderable)
    $()
    this.mouse.pos.sub(scroll)
    // const { mouse: { pos, downPos } } = of(this)
    // downPos.set(pos)
  }

  @fx apply_downPos() {
    const { isDown } = when(this)
    const { mouse: { pos } } = of(this)
    const { xy } = pos
    $()
    const { mouse: { downPos } } = of(this)
    downPos.set(xy)
  }
}

export namespace Pointable {
  export interface It extends Renderable.It {
    pointables?: Pointable.It[]
    pointable: Pointable
    renderable: Renderable
  }
}
