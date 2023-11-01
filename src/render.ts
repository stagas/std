log.active
import { $, fn, fx, of } from 'signal'
import { maybePush, maybeSplice } from 'utils'
import { Animable } from './animable.ts'
import { Point } from './point.ts'
import { Rect } from './rect.ts'
import { Renderable } from './renderable.ts'
import { World } from './world.ts'

interface Dirty {
  owner: Renderable
  rect: Rect
  scroll: Point
}

export class Render
  implements Animable.It {
  constructor(public world: World) { }
  needDirect = false
  dirty = new Map<Renderable, Dirty>()
  drawn: Dirty[] = []
  check: Dirty[] = []
  scroll = $(new Point)
  view = $(new Rect)
  $view = $(new Rect)
  its: Renderable.It[] = []
  @fn add(it: Renderable.It) {
    maybePush(this.its, it)
    // this.its = [...this.its]
    return this
  }
  @fn remove(it: Renderable.It) {
    maybeSplice(this.its, it)
    // this.its = [...this.its]
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
        if (r.its) yield* this.traverse(r.its, c)
        yield it as any
        scroll.sub(r.scroll).round()
      }
      else {
        if (r.its) yield* this.traverse(r.its, c)
        yield it as any
      }
    }
  }
  get animable() {
    $()
    const it = this
    // const { world } = it
    // const { anim } = world
    class RenderAnimable extends Animable {
      // need = Need.Tick | Need.Draw
      @fx trigger_draw() {
        let pass = 0
        for (const { renderable: r } of Renderable.traverse(it.its)) {
          pass |= r.need
        }
        if (pass & (
          Renderable.Need.Init
          | Renderable.Need.Render
          | Renderable.Need.Draw)) {
          $()
          this.need |= Animable.Need.Draw
          return
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
        const { scroll, view, $view } = it
        const { canvas: { c, rect } } = of(it.world)

        rect.clear(c)
        scroll.zero()

        for (const { renderable: r } of it.traverse(it.its, c)) {
          $view.set(view).translateNegative(scroll)
          r.isVisible = r.rect.intersectsRect($view)
          if (!r.isVisible) continue

          if (r.canDirectDraw) {
            c.save()
            scroll.translate(c)
            r.init?.(c)
            r.rect.round()
            c.translate(r.rect.x, r.rect.y)
            r.render!(c, t, false)
            c.restore()
            r.need |= Renderable.Need.Init | Renderable.Need.Render
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
        const { dirty, drawn, scroll, view, $view } = it
        const { canvas: { c }, screen: { pr } } = of(it.world)

        scroll.zero()

        let i = 0

        for (const { renderable: r } of it.traverse(it.its, c)) {
          $view.set(view).translateNegative(scroll)
          r.isVisible = r.rect.intersectsRect($view)
          if (!r.isVisible) continue

          let d = dirty.get(r)

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

          if (d) {
            // TODO: better way?
            if (!d.scroll.equals(scroll)) r.need |= Renderable.Need.Draw

            // element will draw, clear its previous dirty
            // rectangle, and redraw what was below them
            if (r.need & Renderable.Need.Draw) {
              d.rect.clear(c)
              for (let j = 0, other: Dirty; j < i; j++) {
                other = drawn[j]
                d.rect
                  .intersectionRect(other.rect)
                  ?.drawImageNormalizePos(
                    other.owner.canvas.el,
                    c,
                    pr,
                    other.rect
                  )
              }
            }
            // elements that didn't draw, but others
            // cleared them, redraw them (notice this is the inverse
            // of the above)
            else {
              for (let j = 0, other: Dirty; j < i; j++) {
                other = drawn[j]
                other.rect
                  .intersectionRect(d.rect)
                  ?.drawImageNormalizePos(
                    d.owner.canvas.el,
                    c,
                    pr,
                    d.rect
                  )
              }
              drawn[i++] = d
            }
          }
          if (r.need & Renderable.Need.Draw) {
            if (r.draw) {
              r.draw(c, t, scroll)
              if (!d) {
                d = {
                  owner: r,
                  rect: $(new Rect(r.rect.size)),
                  scroll: $(new Point),
                }
                dirty.set(r, d)
              }
              d.rect.setPos(r.rect).translateByPos(scroll)
              d.scroll.set(scroll)
              drawn[i++] = d
            }
            else r.need ^= Renderable.Need.Draw
          }
        }

        this.need ^= Animable.Need.Draw
      }
    }
    return $(new RenderAnimable(it as Animable.It))
  }
}
