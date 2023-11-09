log.active
import { $, fn, fx, of } from 'signal'
import { colory, maybePush, maybeSplice } from 'utils'
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
  previous = $(new FixedArray<Renderable.It>)
  current = $(new FixedArray<Renderable.It>)
  visited = new Set<Renderable>()
  clearing = new Set<Renderable>()
  clearingRects = $(new FixedArray<Rect>)
  painting = new Set<Renderable>()

  its: Renderable.It[] = []
  updated = 0
  // index = { value: 0 }

  get visible() {
    return $(new Rect(this.view.size, this.scroll.inverted))
  }
  @fn add(it: Renderable.It) {
    maybePush(this.its, it)
    // this.its = [...this.its]
    this.updated++
    return this
  }
  @fn remove(it: Renderable.It) {
    maybeSplice(this.its, it)
    // this.its = [...this.its]
    this.updated++
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
  need = Animable.Need.Init

  constructor(public it: Render) { super(it) }

  get debug() {
    return this.it.debug
  }
  get its() {
    const { it } = this
    it.updated
    return [...Renderable.traverse(it.its)]
  }
  get active() {
    const { it, its } = this
    let pass = 0
    it.updated
    for (const { renderable: r } of its) {
      if (r.shouldPaint) {
        pass |= Animable.Need.Draw
      }
    }
    return pass
  }
  @fx trigger_anim_draw_on_its() {
    this.its
    $()
    this.need |= Animable.Need.Draw
  }
  @fx trigger_anim_draw() {
    if (this.active || !this.didDraw) {
      $()
      this.need |= Animable.Need.Draw
      return
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
    const { it, its } = this
    const {
      scroll,
      visible,
      previous,
      current,
      visited,
      clearing,
      clearingRects,
      painting,
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

    for (const { renderable: r } of its) {
      if (r.shouldInit) {
        r.init!(r.canvas.c)
        r.didInit = true
        if (r.renders) r.needDraw = true
      }
    }

    // determine new visibility
    for (const { renderable: r } of it.traverse(it.its, c)) {
      visited.add(r)

      // log('view', r.it.constructor.name, r.view.text)
      // log('visible', visible.text)

      r.isVisible = true
      // !r.isHidden
      //   && r.view.intersectsRect(visible)

      if (r.isVisible && !r.dirtyNext.scroll.equals(scroll)) {
        r.opPaint = true
        r.dirtyNext.scroll.set(scroll)
      }

      if (r.shouldPaint) painting.add(r)
    }

    for (const { renderable: r } of previous.values()) {
      if (!visited.has(r)) {
        r.isVisible = false
      }

      if (r.shouldClear) clearing.add(r)
    }

    for (const r of clearing) {
      clearingRects.add(r.dirtyBefore.view)
    }

    for (const r of painting) {
      clearingRects.add(r.dirtyNext.update())
    }

    for (const rect of mergeRects(
      clearingRects.array,
      clearingRects.count
    ).values()) {
      rect.clear(c)
    }

    for (const r of painting) {
      log('paint', r.it.constructor.name)
      r.paint(c)
    }

    // -- prepare for next

    it.previous = current
    it.current = previous
    it.current.count = 0

    visited.clear()
    clearing.clear()
    painting.clear()

    clearingRects.count = 0

    // cleared.clear()
    // overlaps.count = 0
    // redraws.count = 0

    if (its.length) this.didDraw = true

    if (its.length && !this.active) {
      this.need &= ~Animable.Need.Draw
    }
  }
}
