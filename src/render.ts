log.active
import { $, fn, fx, of } from 'signal'
import { maybePush, maybeSplice, partialIncludes, poolArrayGet } from 'utils'
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

  clearing = $(new FixedArray<Renderable>)
  drawing = $(new FixedArray<Renderable>)
  stationary = $(new FixedArray<Renderable>)

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
        r.before?.(c)
        if (r.its) yield* this.traverse(r.its, c)
        yield it as any
        r.after?.(c)
        scroll.sub(r.scroll).round()
      }
      else {
        if (c) r.before?.(c)
        if (r.its) yield* this.traverse(r.its, c)
        yield it as any
        if (c) r.after?.(c)
      }
    }
  }
  get animable() {
    $()
    const it = this
    // const { world } = it
    // const { anim } = world
    const sr = $(new Rect)

    class RenderAnimable extends Animable {
      get itsNeedDraw() {
        let pass = 0
        it.updated
        for (const { renderable: r } of Renderable.traverse(it.its)) {
          pass |= r.need
          // console.log('PASS', r.it, r.need)
        }
        return pass
        // if (pass) {
        //   $()
        //   this.need |= Animable.Need.Draw
        //   // console.log('THIS NEED')
        //   return
        // }
      }
      // need = Need.Tick | Need.Draw
      @fx trigger_draw() {
        if (this.itsNeedDraw) {
          $()
          this.need |= Animable.Need.Draw
        }
      }
      // @fx anim_start_when_needed() {
      //   if (anim.isAnimating) return
      //   if (this.need & (Animable.Need.Tick | Animable.Need.Draw)) {
      //     $()
      //     anim.start()
      //   }
      // }
      @fn directDraw(t = 1) {
        const { scroll, visible } = it
        const { canvas: { c, rect } } = of(it.world)

        // TODO: we can combine all rects and clear only stuff
        // that were painted --BENCH
        rect.clear(c)

        scroll.zero()

        for (const { renderable: r } of it.traverse(it.its, c)) {
          // $view.set(view).translateNegative(scroll)
          r.isVisible = r.view.intersectsRect(visible)
          if (!r.isVisible) continue

          if (r.canDirectDraw) {
            c.save()
            scroll.translate(c)
            r.init?.(c)
            // CORRECT
            r.view.round().pos.translate(c)

            r.render!(c, t, false)
            c.restore()
            // r.need |= Renderable.Need.Init | Renderable.Need.Render
          }
          else {
            if (r.need & Renderable.Need.Init) {
              if (r.init) r.init(r.canvas.c)
              else {
                r.need ^= Renderable.Need.Init
                r.need |= Renderable.Need.Render
              }
            }
            if (r.need & Renderable.Need.Render) {
              if (r.render) r.render(r.canvas.c, t, true)
              else {
                r.need ^= Renderable.Need.Render
                r.need |= Renderable.Need.Draw
              }
            }
            if (r.draw) r.draw(c, t, scroll)
          }
        }

        this.need ^= Animable.Need.Draw
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

        clearing.count
          = drawing.count
          = stationary.count
          = 0

        scroll.zero()

        // traverse all renderables depth-first
        for (const { renderable: r } of it.traverse(it.its, c)) {
          // check if this renderable is visible
          const isVisible = sr.set(r.view)
            .translate(scroll)
            .intersectsRect(visible)

          // console.log(r.view.text, visible.text)

          if (!r.isVisible) {
            if (!isVisible) {
              r.need = 0
              continue
            }
            r.isVisible = true
            r.need |= Renderable.Need.Init
          }
          else {
            if (!isVisible) {
              // item was visible, but now left,
              // so we need to clear it
              clearing.push(r)

              r.isVisible = false
              r.need = 0
              continue
            }
          }

          // TODO: The 'init' in r 'render' in r etc don't
          // need to be in the hot loop and can be done
          // at an earlier step.
          if (r.need & Renderable.Need.Init) {
            if (r.init) r.init(r.canvas.c)
            else {
              r.need ^= Renderable.Need.Init
              r.need |= Renderable.Need.Render
            }
          }
          if (r.need & Renderable.Need.Render) {
            if (r.render) r.render(r.canvas.c, t, true)
            else {
              r.need ^= Renderable.Need.Render
              r.need |= Renderable.Need.Draw
            }
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
              clearing.push(r)
              r.dirty.scroll.set(scroll)
            }
            else {
              stationary.push(r)
            }
            drawing.push(r)
          }
          else {
            r.need ^= Renderable.Need.Draw
          }
        }

        // clear what was visible before, but is not visible now
        for (let i = 0; i < clearing.count; i++) {
          clearing.array[i].dirty.clear(c)
        }

        // draw scheduled
        for (let i = 0, r: Renderable; i < drawing.count; i++) {
          r = drawing.array[i]
          if (stationary.includes(stationary.count, r)) {
            for (let j = 0; j < clearing.count; j++) {
              clearing.array[j].dirty
                .redrawOverlap(r.dirty, c, pr)
            }
          }
          else {
            r.draw!(c, t, r.dirty.scroll)

            r.dirty.rect
              .set(r.view)
              .translateByPos(r.dirty.scroll)
          }
        }

        if (!this.itsNeedDraw) {
          this.need ^= Animable.Need.Draw
        }
      }
    }
    return $(new RenderAnimable(it as Animable.It))
  }
}
