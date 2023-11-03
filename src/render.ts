// log.active
import { $, fn, fx, of } from 'signal'
import { maybePush, maybeSplice } from 'utils'
import { Animable } from './animable.ts'
import { Dirty } from './dirty.ts'
import { FixedArray } from './fixed-array.ts'
import { Point } from './point.ts'
import { Rect } from './rect.ts'
import { Renderable } from './renderable.ts'
import { World } from './world.ts'

export class Render
  implements Animable.It {
  constructor(public world: World) { }
  needDirect = false
  dirty = new Map<Renderable, Dirty>()
  drawn = $(new FixedArray<Dirty>)
  prev = $(new FixedArray<Dirty>)
  overlaps: Rect[] = []
  check: Dirty[] = []
  visited: Dirty[] = []

  clearing = new Set<Renderable>()
  drawing = new Set<Renderable>()
  stationary = new Set<Renderable>()

  scroll = $(new Point)
  view = $(new Rect)

  get visible() {
    return $(new Rect(this.view.size, this.scroll.inverted))
  }
  its: Renderable.It[] = []
  updated = 0
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
  private *traverse(
    its: Renderable.It[],
    c?: CanvasRenderingContext2D
  ): Generator<Renderable.It> {
    const { scroll } = this
    for (const it of its) {
      const { renderable: r } = it
      if (c && r.scroll) {
        scroll.add(r.scroll).round()
        // r.before?.(c)
        if (r.its) yield* this.traverse(r.its, c)
        yield it as any
        // r.after?.(c)
        scroll.sub(r.scroll).round()
      }
      else {
        // if (c) r.before?.(c)
        if (r.its) yield* this.traverse(r.its, c)
        yield it as any
        // if (c) r.after?.(c)
      }
    }
  }
  get animable() {
    $()
    const it = this
    const sr = $(new Rect)

    class RenderAnimable extends Animable {
      get active() {
        let pass = 0
        it.updated
        for (const { renderable: r } of Renderable.traverse(it.its)) {
          pass |= r.need
          // if (r.need) console.log('PASS', r.it, r.need)
        }
        return pass
      }
      @fx trigger_anim_draw() {
        if (this.active) {
          $()
          this.need |= Animable.Need.Draw
        }
      }
      @fn directDraw(t = 1) {
        // return
        const { scroll, visible, drawing } = it
        const { canvas: { c, rect } } = of(it.world)

        // TODO: we can combine all rects and clear only stuff
        // that were painted --BENCH

        drawing.clear()
        scroll.zero()
        // visible.clear(c)

        for (const { renderable: r } of it.traverse(it.its, c)) {
          // check if this renderable is visible
          const isVisible = !r.isHidden && sr.set(r.view)
            .translate(scroll)
            .intersectsRect(visible)

          // console.log(r.view.text, visible.text)

          if (!r.isVisible) {
            if (!isVisible) {
              r.need = 0
              continue
            }
            r.isVisible = true
            if (r.init) r.need |= Renderable.Need.Init
            else if (r.render) r.need |= Renderable.Need.Render
            else if (r.draw) r.need |= Renderable.Need.Draw
          }
          else {
            if (!isVisible) {
              r.isVisible = false
              r.need = 0
              continue
            }
          }

          r.dirty.scroll.set(scroll)
          drawing.add(r)
        }

        for (const r of drawing) {
          if (r.draw ?? r.canDirectDraw) {
            r.dirty.clear(c)
          }
        }

        for (const r of drawing) {
          if (r.canDirectDraw) {
            c.save()
            r.init?.(c)
            r.dirty.scroll.translate(c)
            r.view.round().pos.translate(c)
            r.render!(c, t, false)
            c.restore()

            r.dirty.rect
              .set(r.view)
              .translateByPos(r.dirty.scroll)

            // always need the renderable to re-init/render
            // after the direct draws finish.
            r.need |= Renderable.Need.Init
          }
          else {
            if (r.init && (r.need & Renderable.Need.Init)) {
              r.init(r.canvas.c)
            }
            else {
              r.need &= ~Renderable.Need.Init
              r.need |= Renderable.Need.Render
            }

            if (r.render && (r.need & Renderable.Need.Render)) {
              r.render(r.canvas.c, t, true)
            }
            else {
              r.need &= ~Renderable.Need.Render
            }

            if (r.draw) {
              r.draw(c, t, r.dirty.scroll)
              r.dirty.rect
                .set(r.view)
                .translateByPos(r.dirty.scroll)
            }
            else {
              r.need &= ~Renderable.Need.Draw
            }
          }
        }

        if (!this.active) {
          this.need &= ~Animable.Need.Draw
        }
      }
      @fn draw(t = 1) {
        if (it.needDirect) {
          this.directDraw(t)
          return
        }

        const { canvas: { c }, screen: { pr } } = of(it.world)

        const {
          scroll,
          visible,

          clearing,
          drawing,
          stationary,
        } = it

        clearing.clear()
        drawing.clear()
        stationary.clear()

        scroll.zero()

        // traverse all renderables depth-first
        for (const { renderable: r } of it.traverse(it.its, c)) {
          // if (!r.init && !r.render && !r.draw) continue

          // check if this renderable is visible
          const isVisible = !r.isHidden && sr.set(r.view)
            .translate(scroll)
            .intersectsRect(visible)

          // console.log(r.view.text, visible.text)

          if (!r.isVisible) {
            if (!isVisible) {
              r.need = 0
              continue
            }
            r.isVisible = true
            if (r.init) r.need |= Renderable.Need.Init
            else if (r.render) r.need |= Renderable.Need.Render
            else if (r.draw) r.need |= Renderable.Need.Draw
          }
          else {
            if (!isVisible) {
              // item was visible, but now left,
              // so we need to clear it
              clearing.add(r)

              r.isVisible = false
              r.need = 0
              continue
            }
          }

          if (r.init && (r.need & Renderable.Need.Init)) {
            r.init(r.canvas.c)
          }
          else {
            r.need &= ~Renderable.Need.Init
            r.need |= Renderable.Need.Render
          }

          if (r.render && (r.need & Renderable.Need.Render)) {
            r.render(r.canvas.c, t, true)
          }
          else {
            r.need &= ~Renderable.Need.Render
          }

          // schedule renderables to draw
          if (r.draw) {
            if (
              // if renderable requested Draw
              (r.need & Renderable.Need.Draw)
              // or its scroll changed
              || !r.dirty.scroll.equals(scroll)
            ) {
              // schedule to clear
              clearing.add(r)
              r.dirty.scroll.set(scroll)
            }
            else {
              stationary.add(r)
            }
            drawing.add(r)
          }
          else {
            r.need &= ~Renderable.Need.Draw
          }
        }

        // clear what was visible before, but is not visible now
        for (const r of clearing) {
          r.dirty.clear(c)
        }

        // draw scheduled
        for (const r of drawing) {
          if (stationary.has(r)) {
            for (const other of clearing) {
              other.dirty
                .redrawOverlap(r.dirty, c, pr)
            }
          }
          else {
            // for (let j = 0; j < clearing.count; j++) {
            //   r.dirty
            //     .redrawOverlap(clearing.array[j].dirty, c, pr)
            // }
            r.draw!(c, t, r.dirty.scroll)

            r.dirty.rect
              .set(r.view)
              .translateByPos(r.dirty.scroll)
          }
        }

        // console.log(drawing.size)

        if (!this.active) {
          this.need &= ~Animable.Need.Draw
        }
      }
    }
    return $(new RenderAnimable(it as Animable.It))
  }
}
