// log.active
import { $, fn, fx, of } from 'signal'
import { maybePush, maybeSplice } from 'utils'
import { Animatable, AnimatableNeed } from './animatable.ts'
import { Point } from './point.ts'
import { Rect } from './rect.ts'
import { Need, Renderable } from './renderable.ts'
import { World } from './world.ts'

interface Dirty {
  owner: Renderable
  rect: Rect
  scroll: Point
}

export class Render {
  constructor(public world: World) { }
  dirty = new Map<Renderable, Dirty>()
  drawn: Dirty[] = []
  check: Dirty[] = []
  scroll: Point = $(new Point)
  its: Renderable.It[] = []
  @fn add(it: Renderable.It) {
    maybePush(this.its, it)
    return this
  }
  @fn remove(it: Renderable.It) {
    maybeSplice(this.its, it)
    return this
  }
  get animatable() {
    $()
    const it = this
    class RenderAnimatable extends Animatable {
      @fx trigger_draw() {
        let pass = 0
        for (const { renderable: r } of it.renderables(it.its)) {
          pass |= r.need
        }
        if (pass & (Need.Render | Need.Draw)) {
          $()
          this.need |= AnimatableNeed.Draw
        }
      }
      draw(t: number) {
        it.directDraw(t)
        // it.draw(t)
      }
    }
    return $(new RenderAnimatable)
  }
  *renderables(its: Renderable.It[], c?: CanvasRenderingContext2D): Generator<Renderable.It & { renderable: Renderable }> {
    const { scroll } = this
    for (const it of its) {
      const { renderables: rs, renderable: r } = it
      if (r) {
        if (c && r.scroll) {
          scroll.add(r.scroll)
          if (rs) yield* this.renderables(rs, c)
          yield it as any
          scroll.sub(r.scroll)
        }
        else {
          if (rs) yield* this.renderables(rs, c)
          yield it as any
        }
      }
      else {
        if (rs) yield* this.renderables(rs, c)
      }
    }
  }
  directDraw(t = 1) {
    const { scroll } = this
    const { canvas: { c, rect } } = of(this.world)

    rect.clear(c)
    scroll.zero()

    for (const { renderable: r } of this.renderables(this.its, c)) {
      if (r.need & Need.Init) {
        if (r.init) r.init(r.canvas.c)
        else {
          r.need ^= Need.Init
          r.need |= Need.Render
        }
      }
      if (r.need & Need.Render) {
        if (r.render) {
          if (r.canDirectDraw) {
            c.save()
            scroll.translate(c)
            r.init?.(c)
            c.translate(r.rect.x, r.rect.y)
            r.render(c, t, false)
            c.restore()
          }
          else {
            r.render(r.canvas.c, t, true)
          }
        }
        else {
          r.need ^= Need.Render
          r.need |= Need.Draw
        }
      }
      if (r.draw) r.draw(c, t, scroll)
    }
  }
  draw(t = 1) {
    const { dirty, drawn, scroll } = this
    const { canvas: { c }, screen: { pr } } = of(this.world)

    scroll.zero()

    let i = 0

    for (const { renderable: r } of this.renderables(this.its, c)) {
      let d = dirty.get(r)

      // TODO: The 'init' in r 'render' in r etc don't
      // need to be in the hot loop and can be done
      // at an earlier step.
      if (r.need & Need.Init) {
        if (r.init) r.init(r.canvas.c)
        else {
          r.need ^= Need.Init
          r.need |= Need.Render
        }
      }
      if (r.need & Need.Render) {
        if (r.render) r.render(r.canvas.c, t, true)
        else {
          r.need ^= Need.Render
          r.need |= Need.Draw
        }
      }

      if (d) {
        // TODO: better way?
        if (!d.scroll.equals(scroll)) r.need |= Need.Draw

        // element will draw, clear its previous dirty
        // rectangle, and redraw what was below them
        if (r.need & Need.Draw) {
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
      if (r.need & Need.Draw) {
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
        else r.need ^= Need.Draw
      }
    }
  }
}
