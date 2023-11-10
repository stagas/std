// log.active
import { $, fn, fx, of } from 'signal'
import { colory, maybePush, maybeSplice, poolArrayGet, randomHex } from 'utils'
import { Animable } from './animable.ts'
import { Dirty } from './dirty.ts'
import { FixedArray } from './fixed-array.ts'
import { Point } from './point.ts'
import { Rect } from './rect.ts'
import { Renderable } from './renderable.ts'
import { World } from './world.ts'
import { mergeRects } from './clip.ts'

const enum Debug {
  None = 0,
  Clear /*  */ = 1 << 0,
  Dirty /*  */ = 1 << 1,
  Visible /**/ = 1 << 2,
  All = 127
}

export class Render
  implements Animable.It {
  constructor(public world: World) { }
  debug = Debug.Clear

  needDirect = false
  wasDirect = false

  view = $(new Rect)
  scroll = $(new Point)
  // previous = $(new FixedArray<Renderable>)
  // current = $(new FixedArray<Renderable>)
  visited = new Set<Renderable>()
  clearing = new Set<Renderable>()
  clearingRects = $(new FixedArray<Rect>)
  overlaps = $(new FixedArray<Rect>)
  painting = new Set<Renderable>()
  painted = new Set<Renderable>()

  its: Renderable.It[] = []
  // updated = 0
  // index = { value: 0 }

  get visible() {
    return $(new Rect(this.view.size, this.scroll.inverted))
  }
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
  ): Generator<Renderable.It> {
    const { scroll } = this

    for (const it of its) {
      const { renderable: r } = it
      const rIts = r.its

      if (r.scroll) {
        scroll.add(r.scroll).round()
        if (rIts) yield* this.traverse(rIts, c)
        scroll.sub(r.scroll).round()
        yield it
      }
      else {
        if (rIts) yield* this.traverse(rIts, c)
        yield it
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
  get debug() {
    return this.it.debug
  }
  @fx trigger_anim_draw() {
    let pass = false
    for (const { renderable: r } of Renderable.traverse(this.it.its)) {
      if (r.need) {
        // console.log(r.need, r.it.constructor.name)
        pass = true
      }
    }
    $()
    if (pass) {
      this.need |= Animable.Need.Draw
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
  @fn draw(t = 1) {
    const { it, tempRect } = this
    const {
      scroll,
      visible,
      // previous,
      // current,
      visited,
      clearing,
      clearingRects,
      painting,
      painted,
      overlaps,
      needDirect,
    } = it
    const {
      canvas: { c, rect },
      screen: { pr },
      skin: { colors: { bg } }
    } = of(it.world)

    const its = [...Renderable.traverse(it.its)]

    log('draw', its.length)

    if (!its.length) {
      return
    }

    for (const { renderable: r } of its) {
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

    scroll.zero()

    // determine new visibility
    for (const { renderable: r } of it.traverse(it.its, c)) {
      visited.add(r)

      // log('view', r.it.constructor.name, r.view.text)
      // log('visible', visible.text)

      // const wasVisible = r.isVisible
      r.isVisible = true //!r.renders || (!r.isHidden && r.view.intersectsRect(visible))

      // if (!wasVisible && r.isVisible) {
      //   r.needInit = r.needRender = r.needDraw = true
      // }

      if (r.renders && r.isVisible && !r.dirtyBefore.scroll.equals(scroll)) {
        r.opPaint = true
      }
      r.dirtyNext.scroll.set(scroll)

      if (r.canDirectDraw && it.needDirect) {
        r.opDirect = true
      }

      if (r.shouldPaint) {
        painting.add(r)
        // console.log(r.it.constructor.name, r.need)
      }
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
      // console.log('CLEAR', r.it.constructor.name)
      painted.delete(r)
      // if (r.it.constructor.name === 'PlotWidget') {
      //   console.log('HEHEY', r.dirtyBefore.view.text)
      // }
      clearingRects.add(r.dirtyBefore.view)
      // r.dirtyBefore.view.clear(c)
    }

    for (const r of painting) {
      painted.add(r)

      if (r.didDraw && !clearing.has(r)) {
        clearingRects.add(r.dirtyBefore.view)
      }
      r.dirtyNext.update()
      clearingRects.add(r.dirtyNext.view)
    }

    if (needDirect) {
      tempRect.combineRects(clearingRects.array, clearingRects.count)
        .clear(c)

    }
    else {
      for (const rect of clearingRects.values()) {
        rect.floorCeil().clear(c)
        // .stroke(c, '#' + randomHex())
      }
    }
    // tempRect.combineRects(clearingRects.array, clearingRects.count)
    //   .clear(c)

    // .stroke(c, '#' + randomHex())

    // for (const rect of mergeRects(
    //   clearingRects.array,
    //   clearingRects.count
    // ).values()) {
    //   rect.clear(c)//.stroke(c, '#' + randomHex())
    // }

    for (const { renderable: r } of its) {
      if (painting.has(r)) {
        r.paint(c)
        painted.add(r)
        // r.dirtyNext.view.stroke(c, '#' + randomHex())
      }
      else {
        if (r.renders && r.isVisible) {
          if (needDirect) {
            const ir = tempRect.intersectionRect(r.dirtyBefore.view)
            if (ir) {
              if (!r.didRender) r.render()
              r.dirtyBefore.redrawIntersectionRect(tempRect, c, pr)
            }
          }
          else {
            overlaps.count = 0
            for (const rect of clearingRects.values()) {
              // TODO: use only below intersection rect
              const ir = rect.intersectionRect(r.dirtyBefore.view)
              if (ir) {
                if (!r.didRender) r.render()
                poolArrayGet(overlaps.array, overlaps.count++, Rect.create)
                  .set(ir.floorCeil())
              }
            }

            if (overlaps.count) for (const rect of mergeRects(overlaps.array, overlaps.count).values()) {
              r.dirtyBefore.redrawIntersectionRect(rect, c, pr)
              // .stroke(c, '#' + randomHex())
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

    clearingRects.count = 0

    // cleared.clear()
    // overlaps.count = 0
    // redraws.count = 0
    // it.needDirect = false

    // console.log('need direct', it.needDirect)
    if (its.length) this.didDraw = true

    if (its.length && its.every(it => !it.renderable.isVisible || !it.renderable.needDraw)) {
      this.need &= ~Animable.Need.Draw
    }
    else {
      const itt = its.find(it => it.renderable.needDraw)
      if (itt) console.log(itt.renderable.need, itt.constructor.name)
    }
  }
}
