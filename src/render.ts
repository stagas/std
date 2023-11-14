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

  debug = Debug.None //Painted //Overlap

  needDirect = false
  needDirectOne = false
  preferDirect = false
  wasDirect = false

  view = $(new Rect)
  visible = $(new Rect)
  origin = $(new Point)
  visited = new Set<Renderable>()
  clearing = new Set<Renderable>()
  clearingRects = $(new FixedArray<Rect>)
  overlaps = $(new FixedArray<Rect>)
  painting = new Set<Renderable>()
  painted = new Set<Renderable>()
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
  *traverse(
    its: Renderable.It[],
    c: CanvasRenderingContext2D,
    depth = 0
  ): Generator<Renderable.It> {
    const { origin } = this

    for (const it of its) {
      const { renderable: r } = it
      const rIts = r.its

      if (r.scroll) {
        origin.add(r.layout).add(r.scroll).round()
        if (rIts) yield* this.traverse(rIts, c, depth + 1)
        origin.sub(r.scroll).sub(r.layout).round()
        if (depth) yield it
      }
      else {
        origin.add(r.layout).round()
        if (rIts) yield* this.traverse(rIts, c, depth + 1)
        origin.sub(r.layout).round()
        if (depth) yield it
      }
    }
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
    return [...its.flatMap(it => it.renderable.flatIts)]
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
      // previous,
      // current,
      visited,
      clearing,
      clearingRects,
      painting,
      painted,
      overlaps,
      needDirect,
      needDirectOne,
      preferDirect,
      drawOver,
    } = it
    const {
      canvas: { c, rect },
      screen: { pr },
      skin: { colors: { bg } }
    } = of(it.world)

    // const its = [...Renderable.traverse(it.its)]

    log('draw', its.length)

    // console.log(its)
    if (!its.length) {
      return
    }

    let index = 0
    for (const [op, { renderable: r }] of its) {
      if (op !== TraverseOp.Item) continue
      r.index = index++
      if (r.shouldInit) {
        r.init!(r.canvas.c)
        r.needInit = false
        r.didInit = true
        if (r.renders) r.needDraw = true
      }
      else if (r.needInit && !r.init) {
        r.needInit = false
        r.didInit = true
        if (r.renders) r.needDraw = true
      }
    }

    origin.zero()

    // determine new visibility
    visible.size.set(view.size)

    for (const { renderable: r } of it.traverse(it.its, c)) {
      visible.pos.set(origin.inverted)
      // visible.fill(c, '#f00')

      visited.add(r)

      // const wasVisible = r.isVisible
      r.isVisible = !r.renders || (!r.isHidden && r.view.intersectsRect(visible))

      // if (!wasVisible && r.isVisible) {
      //   r.needInit = r.needRender = r.needDraw = true
      // }

      if (r.renders && r.isVisible && !r.dirtyBefore.origin.equals(origin)) {
        r.opPaint = true
      }
      r.dirtyNext.origin.set(origin)

      if (r.canDirectDraw) {
        if (it.needDirect || it.needDirectOne) {
          r.opDirect = true
        }
        else if (it.preferDirect && r.shouldPaint) {
          r.opDirect = true
        }
      }

      if (r.shouldPaint) {
        painting.add(r)
      }
    }

    for (const r of painted) {
      if (!visited.has(r)) {
        r.isVisible = false
      }

      if (r.shouldClear) {
        // console.log('CLEAR', r.it.constructor.name, r.it.renderable.need)
        clearing.add(r)
      }
    }

    for (const r of clearing) {
      painted.delete(r)
      if (r.opClear || !r.isVisible || (!r.fillClear && !r.noBelowRedraw)) clearingRects.add(r.dirtyBefore.view)
      // if (!r.fillClear)
      // else r.dirtyBefore.view.drawImage(r.dirtyBefore.canvas.el, c, pr, true)
      // console.log(r.dirtyBefore.view.text, r.it.constructor.name)
    }

    for (const r of painting) {
      // console.log(r.view.text, r.it.constructor.name)
      painted.add(r)

      if (r.didDraw && !clearing.has(r)) {
        if (r.opClear || (!r.fillClear && !r.noBelowRedraw)) clearingRects.add(r.dirtyBefore.view)
        // if (!r.fillClear)
        // else r.dirtyBefore.view.drawImage(r.dirtyBefore.canvas.el, c, pr, true)
      }

      r.dirtyNext.update()

      if (r.noBelowRedraw) r.dirtyNext.view.clear(c)
      else if (!r.fillClear) clearingRects.add(r.dirtyNext.view)
      else drawOver.add(r)
      // if (!r.fillClear)
      // else r.dirtyNext.view.drawImage(r.dirtyNext.canvas.el, c, pr, true)
    }

    // TODO: this is probably needed, for non-painting items that have layout
    // REVIEW
    for (const r of visited) {
      if (!painting.has(r)) {
        r.dirtyNext.update()
      }
    }

    // -----
    // -----

    const shouldDirect = needDirect || needDirectOne //|| preferDirect

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

      // for (const rect of clearingRects.values()) {
      //   ii++
      //   rect.floorCeil().clear(c)
      //   // .stroke(c, '#' + randomHex())
      // }

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

      // console.log('cleared', ii)
    }

    // for (const r of clearing) {
    //   if (r.fillClear) {
    //     // r.dirtyBefore.view.drawImage(r.dirtyBefore.canvas.el, c, pr, true)
    //     // r.dirtyNext.view.fill(c, r.fillClear)
    //   }
    // }

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
        // r.dirtyNext.view.stroke(c, '#' + randomHex())
      }
      else {
        if (r.renders && r.isVisible) {
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
              // if (r.fillClear) continue
              // TODO: use only below intersection rect
              const ir = rect.intersectionRect(r.dirtyBefore.view)
              if (ir) {
                poolArrayGet(overlaps.array, overlaps.count++, Rect.create)
                  .set(ir.floorCeil())
              }
            }
            for (const other of drawOver.values()) {
              if (other.index > r.index) continue
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
      }
    }

    // -- prepare for next

    // it.previous = current
    // it.current = previous
    // it.current.count = 0

    visited.clear()
    clearing.clear()
    painting.clear()
    drawOver.clear()

    clearingRects.count = 0

    if (needDirectOne) it.needDirectOne = false

    // console.log(needDirect, needDirectOne)
    // cleared.clear()
    // overlaps.count = 0
    // redraws.count = 0
    // it.needDirect = false

    // console.log('tick')
    // console.log('need direct', it.needDirect)
    if (its.length) this.didDraw = true

    if (its.length && its.every(([, it]) =>
      !it.renderable.isVisible || !it.renderable.needDraw)) {
      this.need &= ~Animable.Need.Draw
    }
    // else {
    //   const itt = its.find(it => it.renderable.needDraw)
    //   if (itt) console.log(itt.renderable.need, itt.constructor.name)
    // }
  }
}
