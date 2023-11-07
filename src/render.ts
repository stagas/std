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
  ): Generator<Renderable.It> {
    const { scroll } = this

    for (const it of its) {
      const { renderable: r } = it
      const rIts = r.its

      if (c && r.scroll) {
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

enum Debug {
  None = 0,
  Clear = 1 << 0,
  Dirty = 1 << 1,
  Visible = 1 << 2,
  All = 127
}

class RenderAnimable extends Animable {
  need = Animable.Need.Init
  debug = Debug.None
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
  @fn rRender(r: Renderable, c: CanvasRenderingContext2D, t: number, scroll: Point) {
    r.render?.(c, t, scroll)
    r.need &= ~Renderable.Need.Render
    r.need |= Renderable.Need.Draw
    // r.view.stroke(c, '#' + randomHex())
    r.didRender = true
  }
  @fn rDraw(r: Renderable, c: CanvasRenderingContext2D, t: number) {
    const { it } = this
    const { scroll } = it
    r.draw?.(c, t, r.dirty.scroll)
    r.need &= ~Renderable.Need.Draw
    r.didDraw = true
  }
  @fn rClear(r: Renderable, c: CanvasRenderingContext2D) {
    // if (r.it.constructor.name === 'Text') {
    //   colory('Text', r.dirty.rect.text)
    // }
    // r.dirty?.scroll.set(r.dirty.nextScroll)
    r.clear(c)
    if (this.debug & Debug.Clear) {
      r.dirty.stroke(c, '#' + randomHex())
    }
    r.need &= ~Renderable.Need.Clear
  }
  @fn rUpdateVisibleAndScroll(r: Renderable, c: CanvasRenderingContext2D) {
    const { it: { visible, scroll } } = this

    if (this.debug & Debug.Visible) {
      r.view.stroke(c, '#' + randomHex())
    }

    const isVisible =
      !r.isHidden
      && r.view.intersectsRect(visible)

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
        r.need = Renderable.Need.Clear
        return false
      }
    }

    if (r.renders && r.dirty && !r.dirty.nextScroll.equals(scroll)) {
      r.dirty.nextScroll.set(scroll)
      r.need |= Renderable.Need.Paint | Renderable.Need.Clear
    }

    return true
  }
  @fn rScheduleClear(d: Dirty) {
  }
  @fn rSchedulePaint(r: Renderable, c: CanvasRenderingContext2D) {

  }
  @fn rDirtyUpdate(r: Renderable, c: CanvasRenderingContext2D) {
    r.dirty.rect.set(r.view)

    // debug rect
    if (this.debug & Debug.Dirty) {
      r.dirty.stroke(c, '#' + randomHex())
    }

    this.it.current.push(r.dirty)
  }
  last?: Renderable | null
  tempPoint = $(new Point)
  @fn rDirectDraw(r: Renderable, c: CanvasRenderingContext2D, t: number) {
    const { tempPoint } = this

    c.save()
    this.rInit(r, c)
    tempPoint
      .set(r.dirty.scroll)
      .add(r.view.pos)
    if (r.padding) {
      tempPoint.add(r.padding)
    }
    tempPoint.translate(c)
    this.rRender(r, c, t, r.dirty.scroll)
    c.restore()

    this.last = r

    r.need &= ~Renderable.Need.Draw
    // r.didDraw = true
  }
  @fn rPaint(r: Renderable, c: CanvasRenderingContext2D, t: number) {
    r.need &= ~Renderable.Need.Paint
    r.dirty?.scroll.set(r.dirty.nextScroll)

    if (r.need & Renderable.Need.Init) {
      this.rInit(r, r.canvas.c)
    }

    if (!r.renders) return

    if (r.preferDirectDraw) {
      // if (r.need & Renderable.Need.Render) {
      this.rDirectDraw(r, c, t)
      this.rDirtyUpdate(r, c)
      // }
    }
    else {
      if (r.need & Renderable.Need.Render) {
        r.rect.size.clear(r.canvas.c)
        this.rRender(r, r.canvas.c, t, r.dirty.scroll)
        r.didDraw = true
      }
      // if (r.need & Renderable.Need.Draw) {
      this.rDraw(r, c, t)
      this.rDirtyUpdate(r, c)
      // }
    }
  }
  @fn init() {
    const { it } = this
    const { canvas: { c, rect }, screen: { pr }, skin: { colors: { bg } } } = of(it.world)
    rect.fillColor = '#000'
    rect.fill(c)
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

    this.last = null

    // c.save()

    // c.save()
    // -- prepare

    // schedule clearing
    for (const d of previous.values()) {
      // this.rScheduleClear(d)
      // let r = d.owner
      // if (r.didDraw && r.need & (Renderable.Need.Render | Renderable.Need.Draw)) {
      // if (r.renders) {

      // r.need |= Renderable.Need.Clear
      // }
      // }
      this.rClear(d.owner, c)
    }

    // update visibility and scroll and schedule drawing
    for (const { renderable: r } of it.traverse(it.its, c)) {
      if (this.rUpdateVisibleAndScroll(r, c)) {
        r.need |= Renderable.Need.Paint
      }
    }

    //-- do

    // for (const { renderable: r } of Renderable.traverse(it.its)) {
    //   if (r.need & Renderable.Need.Clear) {
    //     this.rClear(r, c)
    //   }
    // }

    for (const { renderable: r } of Renderable.traverse(it.its)) {
      if (r.need & Renderable.Need.Paint) {
        this.rPaint(r, c, t)
      }
    }

    // -- reset state

    // if (this.last) {
    //   c.restore()
    //   c.restore()
    // }

    // -- prepare for next

    it.previous = current
    it.current = previous
    it.current.count = 0

    if (!this.active) {
      this.need &= ~Animable.Need.Draw
    }
  }
}
