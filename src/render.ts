// log.active
import { $, fn, fx, of } from 'signal'
import { colory, maybePush, maybeSplice, poolArrayGet, randomHex } from 'utils'
import { Animable } from './animable.ts'
import { mergeRects } from './clip.ts'
import { FixedArray } from './fixed-array.ts'
import { Overlap } from './overlap.ts'
import { Point } from './point.ts'
import { Rect } from './rect.ts'
import { Renderable } from './renderable.ts'
import { World } from './world.ts'
import { Dirty } from './dirty.ts'

export class Render
  implements Animable.It {
  constructor(public world: World) { }

  needDirect = false
  wasDirect = false

  clearing = new Set<Renderable>()
  stationary = new Set<Renderable>()
  drawn = new Set<Renderable>()
  drawing = new Set<Renderable>()
  prev = new Set<Renderable>()
  overlaps = $(new FixedArray<Overlap>)
  redraws = $(new FixedArray<Rect>)

  previous = $(new FixedArray<Dirty>)
  current = $(new FixedArray<Dirty>)

  scroll = $(new Point)
  view = $(new Rect)

  its: Renderable.It[] = []
  updated = 0
  index = { value: 0 }

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
    c?: CanvasRenderingContext2D,
    // depth = 0,
  ): Generator<Renderable.It> {
    const { scroll } = this
    for (const it of its) {
      const { renderable: r } = it
      if (r.dirty) r.dirty.index = this.index.value++
      // r.dirty.depth = depth
      const rIts = r.its

      if (c && r.scroll) {
        // r.before?.(c)
        scroll.add(r.scroll).round()
        // colory('scroll', scroll.text)
        if (rIts) yield* this.traverse(rIts, c) //, depth + 1)
        scroll.sub(r.scroll).round()

        if (r.draw || r.render || r.init) {
          yield it as any
        }
        else {
          r.need = 0
          r.isVisible = true
        }
        // r.after?.(c)
      }
      else {
        // if (c) r.before?.(c)
        if (rIts) yield* this.traverse(rIts, c) //, depth + 1)
        if (r.draw || r.render || r.init) {
          yield it as any
        }
        else {
          r.need = 0
          r.isVisible = true
        }
        // if (c) r.after?.(c)
      }
    }
  }
  get animable() {
    $(); return $(new RenderAnimable(this))
  }
}

class RenderAnimable extends Animable {
  _tempRect = $(new Rect)
  need = Animable.Need.Init
  constructor(public it: Render) { super(it) }
  get active() {
    const { it } = this
    let pass = 0
    it.updated
    for (const { renderable: r } of Renderable.traverse(it.its)) {
      pass |= r.need
    }
    return pass
  }
  @fx trigger_anim_draw() {
    if (this.active) {
      $()
      this.need |= Animable.Need.Draw
      return
    }
  }
  @fn rInit(r: Renderable, c: CanvasRenderingContext2D) {
    r.init?.(c)
    r.need &= ~Renderable.Need.Init
    r.need |= Renderable.Need.Render
    r.didInit = true
  }
  @fn rRender(r: Renderable, c: CanvasRenderingContext2D, t: number) {
    r.render?.(c, t)
    r.need &= ~Renderable.Need.Render
    r.need |= Renderable.Need.Draw
    // r.view.stroke(c, '#' + randomHex())
    r.didRender = true
  }
  @fn rDraw(r: Renderable, c: CanvasRenderingContext2D, t: number) {
    const { it } = this
    const { scroll } = it
    r.draw?.(c, t, scroll)
    r.need &= ~Renderable.Need.Draw
    r.didDraw = true
  }
  @fn rClear(r: Renderable, c: CanvasRenderingContext2D) {
    // if (r.it.constructor.name === 'Text') {
    //   colory('Text', r.dirty.rect.text)
    // }
    r.clear(c)
    r.need &= ~Renderable.Need.Clear
  }
  @fn rScheduleClear(d: Dirty) {
    let r = d.owner
    if (r.didDraw && r.need & (Renderable.Need.Render | Renderable.Need.Draw)) {
      r.need |= Renderable.Need.Clear
    }
  }
  @fn rSchedulePaint(r: Renderable) {
    if (this.rUpdateVisibleAndScroll(r)) {
      r.need |= Renderable.Need.Paint
    }
  }
  @fn rDirtyUpdate(r: Renderable) {
    r.dirty.rect.set(r.view)
    this.it.current.push(r.dirty)
  }
  @fn rUpdateVisibleAndScroll(r: Renderable) {
    const { it: { visible, scroll }, _tempRect } = this

    const isVisible = !r.isHidden
      && _tempRect.set(r.view)
        .translateNegative(scroll)
        .intersectsRect(visible)

    if (!r.isVisible) {
      if (!isVisible) {
        r.need = 0
        return false
      }

      r.isVisible = true
      r.need |= Renderable.Need.Init
    }
    else {
      if (!isVisible) {
        r.isVisible = false
        r.need = 0
        return false
      }
    }

    r.dirty.nextScroll.set(scroll)
    return true
  }
  @fn rDirectDraw(r: Renderable, c: CanvasRenderingContext2D, t: number) {
    const { it } = this
    const { scroll } = it

    c.save()
    this.rInit(r, c)
    r.view.pos.translate(c)
    r.dirty.scroll.translate(c)
    this.rRender(r, c, t)
    c.restore()

    r.need &= ~Renderable.Need.Draw
    r.didDraw = true
  }
  @fn rPaint(r: Renderable, c: CanvasRenderingContext2D, t: number) {
    r.need &= ~Renderable.Need.Paint
    r.dirty.scroll.set(r.dirty.nextScroll)

    if (r.need & Renderable.Need.Init) {
      this.rInit(r, r.canvas.c)
    }

    if (!r.renders) return

    if (r.preferDirectDraw) {
      if (r.need & Renderable.Need.Render) {
        this.rDirectDraw(r, c, t)
        this.rDirtyUpdate(r)
      }
    }
    else {
      if (r.need & Renderable.Need.Render) {
        r.rect.size.clear(r.canvas.c)
        this.rRender(r, r.canvas.c, t)
      }
      if (r.need & Renderable.Need.Draw) {
        this.rDraw(r, c, t)
        this.rDirtyUpdate(r)
      }
    }
  }
  @fn init() {
    const { it } = this
    const { canvas: { c, rect }, screen: { pr }, skin: { colors: { bg } } } = of(it.world)
    rect.fillColor = bg
    rect.fill(c, bg)
    this.need &= ~Animable.Need.Init
  }
  @fn draw(t = 1) {
    const { it } = this
    const { canvas: { c, rect }, screen: { pr }, skin: { colors: { bg } } } = of(it.world)
    const { scroll } = it
    const {
      previous,
      current,

      clearing,
      drawing,

      visible,
    } = it

    current.count = 0

    // -- prepare

    // schedule clearing
    for (const d of previous.values()) {
      this.rScheduleClear(d)
    }

    // update visibility and scroll and schedule drawing
    for (const { renderable: r } of it.traverse(it.its, c)) {
      this.rSchedulePaint(r)
    }

    //-- do

    for (const { renderable: r } of Renderable.traverse(it.its)) {
      if (r.need & Renderable.Need.Clear) {
        this.rClear(r, c)
      }
    }

    for (const { renderable: r } of Renderable.traverse(it.its)) {
      if (r.need & Renderable.Need.Paint) {
        this.rPaint(r, c, t)
      }
    }

    // -- prepare for next

    it.previous = current
    it.current = previous

    if (!this.active) {
      this.need &= ~Animable.Need.Draw
    }
  }
}
