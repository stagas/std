// log.active
import { $, fn, fx, of } from 'signal'
import { maybePush, maybeSplice, poolArrayGet, randomHex } from 'utils'
import { Animable } from './animable.ts'
import { mergeRects } from './clip.ts'
import { FixedArray } from './fixed-array.ts'
import { Point } from './point.ts'
import { Rect } from './rect.ts'
import { Renderable, TraverseOp } from './renderable.ts'
import { World } from './world.ts'

const enum Debug {
  None = 0,
  Clear /*  */ = 1 << 0,
  Dirty /*  */ = 1 << 1,
  Visible /**/ = 1 << 2,
  Overlap /**/ = 1 << 3,
  Painted /**/ = 1 << 4,
  All = 127
}

export class Render
  implements Animable.It {
  constructor(public world: World) { }

  debug = Debug.None //Overlap

  needDirect = false
  needDirectOne = false
  preferDirect = false
  wasDirect = false

  view = $(new Rect)
  visible = $(new Rect)
  origin = { x: 0, y: 0 }
  visited = new Set<Renderable>()
  clearing = new Set<Renderable>()
  clearingRects = $(new FixedArray<Rect>)
  overlaps = $(new FixedArray<Rect>)
  painting = new Set<Renderable>()
  painted = new Set<Renderable>()
  updating = new Set<Renderable>()
  drawOver = new Set<Renderable>()

  its: Renderable.It[] = []

  @fn add(it: Renderable.It) {
    maybePush(this.its, it)
    return this
  }
  @fn remove(it: Renderable.It) {
    maybeSplice(this.its, it)
    return this
  }
  get animable() {
    $(); return $(new RenderAnimable(this))
  }
}

class RenderAnimable extends Animable {
  need = Animable.Need.Init | Animable.Need.Draw
  constructor(public it: Render) { super(it) }
  tempRect = $(new Rect)
  get renderableIts() {
    const { its } = this.it
    const rIts = [...its.flatMap(it => it.renderable.flatIts)]
    $()
    let index = 0
    for (const [op, { renderable: r }] of rIts) {
      if (op !== TraverseOp.Item) continue
      r.index = index++
    }
    return rIts
  }
  get debug() {
    return this.it.debug
  }
  @fx trigger_anim_draw() {
    let pass = false
    for (const [, { renderable: r }] of this.renderableIts) {
      if (r.isVisible && r.need) {
        // console.log(r.need, r.it.constructor.name, r.isVisible)
        pass = true
        // break
      }
    }
    $()
    if (pass) {
      this.need |= Animable.Need.Draw
    }
  }
  @fx trigger_redraw_on_viewport_resize() {
    const { w, h } = this.it.world.screen.viewport
    $()
    for (const [, it] of this.renderableIts) {
      if (it.renderable.renders) {
        it.renderable.needDraw = true
      }
    }
  }
  @fn init() {
    const { it } = this
    const {
      canvas: { c, rect },
      screen: { pr },
      skin: { colors: { bg } }
    } = of(it.world)

    rect.fillColor = '#000'
    rect.fill(c)
    this.need &= ~Animable.Need.Init
  }
  @fn tickOne(dt = 1) {
    const { renderableIts: its } = this
    for (const [, it] of its) {
      it.renderable.dt = dt
    }
  }
  draw(t = 1) {
    const { it, tempRect, renderableIts: its, debug } = this
    const {
      origin,
      visible,
      view,
    } = it
    const {
      canvas,
      canvas: { c, rect },
      screen: { pr },
      skin: { colors: { bg } }
    } = of(it.world)

    canvas.clear()

    visible.size.set(view.size)

    visible.x = visible.y = origin.x = origin.y = 0
    // visible.clear(c)

    for (const [op, { renderable: r }] of its) {
      if (op === TraverseOp.Item) {
        if (r.shouldInit || (r.needInit && !r.init)) {
          r.init?.(r.canvas.c)
          r.needInit = false
          r.needDraw = true
          r.didInit = true
        }

        r.opDirect = true //r.needDraw //true

        const o = r.dirtyNext.origin
        o.x = origin.x
        o.y = origin.y
        r.dirtyNext.update()
        // console.log(r.view.text, visible.text)
        r.isVisible = !r.renders || (!r.isHidden && r.view.intersectsRect(visible))
        if (r.renders && r.isVisible) {
          if (r.didDraw || r.needRender || r.needDraw) {
            // r.clearNext(c)
            r.paint(c)
          }

        }
        else {
          r.needDraw = false
        }
      }
      else {
        if (op === TraverseOp.Enter) {
          if (r.scroll) {
            origin.x = Math.round(origin.x + r.layout.x + r.scroll.x)
            origin.y = Math.round(origin.y + r.layout.y + r.scroll.y)
          }
          else {
            origin.x = Math.round(origin.x + r.layout.x)
            origin.y = Math.round(origin.y + r.layout.y)
          }
        }
        else if (op === TraverseOp.Leave) {
          if (r.scroll) {
            origin.x = Math.round(origin.x - r.scroll.x - r.layout.x)
            origin.y = Math.round(origin.y - r.scroll.y - r.layout.y)
          }
          else {
            origin.x = Math.round(origin.x - r.layout.x)
            origin.y = Math.round(origin.y - r.layout.y)
          }
        }
        const p = visible.pos
        p.x = -origin.x
        p.y = -origin.y
      }
    }

    if (its.length) this.didDraw = true

    if (its.length && its.every(isNotVisibleAndNotDrawing)) {
      this.need &= ~Animable.Need.Draw
    }
    // console.log('render')
    else {
    //   // else {
      const itt = its.find(([,it]) => it.renderable.needRender)
      if (itt) console.log(itt[1].renderable.need, itt[1].constructor.name)
    // // }
    }
  }
}

function isNotVisibleAndNotDrawing([, it]: [op: TraverseOp, it: Renderable.It]) {
  return !it.renderable.isVisible || !it.renderable.needDraw
}
