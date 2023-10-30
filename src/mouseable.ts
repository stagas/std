import { $, of } from 'signal'
import { Keyboardable } from './keyboardable.ts'
import { Mouse } from './mouse.ts'
import { Point } from './point.ts'
import { Renderable } from './renderable.ts'

export abstract class Mouseable {
  constructor(
    public it: Mouseable.It,
    public downCount = of(it.ctx.world).mouse.$.downCount,
    public downTime = of(it.ctx.world).mouse.$.downTime,
    public mouse = $({
      btns: of(it.ctx.world).pointer.$.buttons,
      wheel: of(it.ctx.world).pointer.$.wheel,
      pos: $(new Point),
      downPos: $(new Point)
    }),
  ) { }

  abstract hitArea?: { isPointWithin(p: Point): boolean }
  canHover = true
  cursor = 'default'

  isDown = false
  isFocused = false
  isHovering = false

  getItAtPoint(p: Point): Mouseable.It | false | undefined {
    return this.hitArea?.isPointWithin(p) && this.it
  }

  public onMouseEvent?(kind: Mouse.EventKind): true | undefined | void
}

export namespace Mouseable {
  export interface It extends Renderable.It {
    mouseables?: Mouseable.It[]
    mouseable: Mouseable
    keyboardable?: Keyboardable
    renderable: Renderable
  }
}
