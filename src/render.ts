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
  // updated = 0
  // index = { value: 0 }

  @fn add(it: Renderable.It) {
    maybePush(this.its, it)
    // this.its = [...this.its]
    // this.updated++
    return this
  }
  @fn remove(it: Renderable.It) {
    maybeSplice(this.its, it)
    // this.its = [...this.its]
    // this.updated++
    return this
  }
  // *traverse(
  //   its: Renderable.It[],
  //   c: CanvasRenderingContext2D,
  //   depth = 0
  // ): Generator<Renderable.It> {
  //   const { origin } = this

  //   for (const it of its) {
  //     const { renderable: r } = it
  //     const rIts = r.its

  //     if (r.scroll) {
  //       origin.add(r.layout).add(r.scroll).round()
  //       if (rIts) yield* this.traverse(rIts, c, depth + 1)
  //       origin.sub(r.scroll).sub(r.layout).round()
  //       if (depth) yield it
  //     }
  //     else {
  //       origin.add(r.layout).round()
  //       if (rIts) yield* this.traverse(rIts, c, depth + 1)
  //       origin.sub(r.layout).round()
  //       if (depth) yield it
  //     }
  //   }
  // }
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
        break
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
  visit(op: TraverseOp, r: Renderable) {
    const { it, it: { origin, painting, visible, updating } } = this

    let o: Point
    if (op === TraverseOp.Item) {
      it.visited.add(r)

      if (r.isVisible = !r.renders || (
        !r.isHidden && r.view.intersectsRect(visible))) {
        if (r.renders && !r.dirtyBefore.origin
          .equalsParameters(origin.x, origin.y)) {
          r.opPaint = true
        }
        o = r.dirtyNext.origin
        o.x = origin.x
        o.y = origin.y

        if (r.canDirectDraw && (
          it.needDirect
          || it.needDirectOne
          || (it.preferDirect && r.shouldPaint))) {
          r.opDirect = true
        }

        if (r.shouldPaint) {
          painting.add(r)
        }
        // a non-'renders' can request draw
        else {
          updating.add(r)
          if (r.needDraw) {
            r.needDraw = false
          }
        }
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
  redrawOverlaps(c: CanvasRenderingContext2D, pr: number, shouldDirect: boolean, r: Renderable) {
    const { tempRect, it: { overlaps, clearingRects, debug, drawOver } } = this

    if (shouldDirect) {
      const ir = tempRect.intersectionRect(r.dirtyBefore.view)
      if (ir) {
        if (!r.didRender) r.render()
        r.dirtyBefore.redrawIntersectionRect(tempRect, c, pr)
      }
    }
    else {
      overlaps.count = 0
      for (const rect of clearingRects.values()) {
        const ir = rect.intersectionRect(r.dirtyBefore.view)
        if (ir) {
          poolArrayGet(overlaps.array, overlaps.count++, Rect.create)
            .set(ir.floorCeil())
        }
      }
      for (const other of drawOver.values()) {
        if (other.index > r.index) break
        const rect = other.dirtyNext.view
        const ir = rect.intersectionRect(r.dirtyBefore.view)
        if (ir) {
          poolArrayGet(overlaps.array, overlaps.count++, Rect.create)
            .set(ir.floorCeil())
        }
      }

      if (overlaps.count) {
        if (!r.didRender) r.render()
        for (const rect of mergeRects(overlaps.array, overlaps.count).values()) {
          r.dirtyBefore.redrawIntersectionRect(rect, c, pr)

          if (debug & Debug.Overlap) {
            rect.stroke(c, '#' + randomHex())
          }
        }
      }
    }

  }
  draw(t = 1) {
    const { it, tempRect, renderableIts: its, debug } = this
    const {
      origin,
      visible,
      view,
      visited,
      clearing,
      clearingRects,
      painting,
      painted,
      updating,
      needDirect,
      needDirectOne,
      drawOver,
    } = it
    const {
      canvas: { c, rect },
      screen: { pr },
      skin: { colors: { bg } }
    } = of(it.world)

    log('draw', its.length)

    if (!its.length) {
      return
    }

    for (const [op, { renderable: r }] of its) {
      if (op !== TraverseOp.Item) continue

      if (r.shouldInit || (r.needInit && !r.init)) {
        r.init?.(r.canvas.c)
        r.needInit = false
        r.needDraw = true
        r.didInit = true
      }
    }

    origin.x = origin.y = 0

    // determine new visibility
    visible.size.set(view.size)
    visible.pos.setParameters(-origin.x, -origin.y)

    for (const [op, { renderable: r }] of its) {
      this.visit(op, r)
    }

    for (const r of painted) {
      if (!visited.has(r)) {
        r.isVisible = false
      }

      if (r.shouldClear) {
        clearing.add(r)
      }
    }

    for (const r of clearing) {
      painted.delete(r)
      if (r.opClear || !r.isVisible || (!r.fillClear && !r.noBelowRedraw)) clearingRects.add(r.dirtyBefore.view)
    }

    for (const r of painting) {
      painted.add(r)

      if (r.didDraw && !clearing.has(r)) {
        if (r.opClear || (!r.fillClear && !r.noBelowRedraw)) clearingRects.add(r.dirtyBefore.view)
      }

      r.dirtyNext.update()

      if (r.noBelowRedraw) r.dirtyNext.view.clear(c)
      else if (!r.fillClear) clearingRects.add(r.dirtyNext.view)
      else drawOver.add(r)
    }

    for (const r of updating) {
      r.dirtyNext.update()
    }

    // -----
    // -----

    const shouldDirect = needDirect || needDirectOne

    // -----
    // -----

    if (shouldDirect) {
      tempRect
        .combineRects(clearingRects.array, clearingRects.count)
        .clear(c)

      if (debug & Debug.Clear) {
        tempRect.stroke(c, '#' + randomHex())
      }
    }
    else {
      let ii = 0

      for (const rect of mergeRects(
        clearingRects.array,
        clearingRects.count
      ).values()) {
        ii++
        rect.clear(c)

        if (debug & Debug.Clear) {
          rect.stroke(c, '#' + randomHex())
        }
      }
    }

    for (const [op, { renderable: r }] of its) {
      if (op === TraverseOp.Enter) {
        if (r.clipContents) {
          c.save()
          r.dirtyNext.view.clip(c)
        }
        continue
      }
      else if (op === TraverseOp.Leave) {
        if (r.clipContents) {
          c.restore()
        }
        continue
      }

      r.opClear = false

      if (painting.has(r)) {
        const view = r.paint(c)
        painted.add(r)
        if (debug & Debug.Painted) {
          view?.stroke(c, '#' + randomHex())
        }
      }
      else {
        if (r.renders && r.isVisible) {
          this.redrawOverlaps(c, pr, shouldDirect, r)
        }
      }
    }

    // -- prepare for next

    visited.clear()
    clearing.clear()
    painting.clear()
    drawOver.clear()

    clearingRects.count = 0

    if (needDirectOne) it.needDirectOne = false

    if (its.length) this.didDraw = true

    if (its.length && its.every(isNotVisibleAndNotDrawing)) {
      this.need &= ~Animable.Need.Draw
    }
    // else {
    //   const itt = its.find(it => it.renderable.needDraw)
    //   if (itt) console.log(itt.renderable.need, itt.constructor.name)
    // }
  }
}

function isNotVisibleAndNotDrawing([, it]: [op: TraverseOp, it: Renderable.It]) {
  return !it.renderable.isVisible || !it.renderable.needDraw
}
