import { $, fx, of } from 'signal'
import { Keyboardable } from './keyboardable.ts'
import { Mouse } from './mouse.ts'
import { Point } from './point.ts'
import { Rect } from './rect.ts'
import { Renderable } from './renderable.ts'
import { TraverseOp, traverse } from './traverse.ts'

export type MouseTraverseOp = [op: TraverseOp, it: Mouseable.It]

export abstract class Mouseable {
  static traverse(its: Mouseable.It[]) {
    return traverse('mouseable', its as any)
  }
  get its(): Mouseable.It[] | undefined { return }
  get flatIts(): MouseTraverseOp[] {
    return [...Mouseable.traverse(this.its ?? [])]
  }
  get visibleIts() {
    const { flatIts } = this
    const vits: MouseTraverseOp[] = []
    outer: for (let i = 0; i < flatIts.length; i++) {
      const top = flatIts[i]
      const [op, m] = top
      const r = m.renderable
      if (op === TraverseOp.Item) {
        if (r.isVisible) vits.push(top)
      }
      else {
        if (op === TraverseOp.Enter) {
          if (!r.isVisible) {
            let top2
            while (top2 = flatIts[++i]) {
              const [op2, { renderable: r2 }] = top2
              if (op2 === TraverseOp.Leave) {
                if (r === r2) continue outer
              }
            }
          }
          else vits.push(top)
        }
        else if (r.isVisible) vits.push(top)
      }
    }
    return vits
  }

  // static some(its: Mouseable.It[], predicate: (m: Mouseable.It) => boolean) {
  //   for (const [op, m] of this.flatIts) {
  //     if (op !== TraverseOp.Item) continue
  //     if (predicate(m)) return true
  //   }
  //   return false
  // }

  canHover = true
  canFocus = true
  cursor = 'default'

  constructor(
    public it: Mouseable.It,
    public hitArea: Mouseable.HitArea = it.renderable.view,
  ) { }

  isDown = false
  isFocused = false
  isHovering = false

  getItAtPoint(p: Point): Mouseable.It | false | undefined {
    return this.hitArea?.isPointWithin(p) && this.it
  }

  get mouse() {
    $()
    const { mouse: m, pointer: p } = of(this.it.ctx.world)
    return $({
      real: p.$.real,
      time: p.$.time,
      alt: p.$.alt,
      ctrl: p.$.ctrl,
      shift: p.$.shift,
      buttons: p.$.buttons,
      wheel: p.$.wheel,
      pos: $(new Point),
      clampedPos: $(new Point),
      downPos: $(new Point),
      downCount: m.$.downCount,
      downTime: m.$.downTime,
      isDown: $(this).$.isDown,
      isFocused: $(this).$.isFocused,
      isHovering: $(this).$.isHovering,
    })
  }

  @fx clamp_pos() {
    const { it: { ctx: { world: { screen: { rect } } } } } = this
    const { pos, clampedPos } = this.mouse
    const { x, y } = pos
    $()
    clampedPos.set(pos).contain(rect)
  }
  public onMouseEvent?(kind: Mouse.EventKind): true | undefined | void
}

export namespace Mouseable {
  export interface It extends Renderable.It {
    mouseable: Mouseable
    keyboardable?: Keyboardable
  }
  export interface HitArea extends Rect {
    isPointWithin(p: Point): boolean
  }
}
