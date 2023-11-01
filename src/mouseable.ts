import { $, of } from 'signal'
import { Keyboardable } from './keyboardable.ts'
import { Mouse } from './mouse.ts'
import { Point } from './point.ts'
import { Renderable } from './renderable.ts'

export abstract class Mouseable {
  canHover = true
  cursor = 'default'

  constructor(
    public it: Mouseable.It,
    public hitArea: Mouseable.HitArea = it.renderable.rect
  ) { }

  isDown = false
  isFocused = false
  isHovering = false

  get its(): Mouseable.It[] | undefined { return }

  getItAtPoint(p: Point): Mouseable.It | false | undefined {
    return this.hitArea?.isPointWithin(p) && this.it
  }

  get mouse() {
    $()
    const { mouse: m, pointer: p } = of(this.it.ctx.world)
    return $({
      real: p.$.real,
      alt: p.$.alt,
      ctrl: p.$.ctrl,
      shift: p.$.shift,
      buttons: p.$.buttons,
      wheel: p.$.wheel,
      pos: $(new Point),
      downPos: $(new Point),
      downCount: m.$.downCount,
      downTime: m.$.downTime,
      isDown: $(this).$.isDown,
      isFocused: $(this).$.isFocused,
      isHovering: $(this).$.isHovering,
    })
  }

  public onMouseEvent?(kind: Mouse.EventKind): true | undefined | void
}

export namespace Mouseable {
  export interface It extends Renderable.It {
    mouseable: Mouseable
    keyboardable?: Keyboardable
  }
  export interface HitArea {
    isPointWithin(p: Point): boolean
  }
}
