// log.active
import { $, fn, fx, of } from 'signal'
import { maybePush, maybeSplice } from 'utils'
import { Animatable, AnimatableNeed } from './animatable.ts'
import { Need, Renderable } from './renderable.ts'
import { World } from './world.ts'
import { Point } from './point.ts'
import { Rect } from './rect.ts'

interface Dirty {
  owner: Renderable
  rect: Rect
}

export class Render {
  constructor(public world: World) { }
  its: Renderable.It[] = []
  @fn add(it: Renderable.It) {
    maybePush(this.its, it)
    return this
  }
  @fn remove(it: Renderable.It) {
    maybeSplice(this.its, it)
    return this
  }
  *renderables(its: Renderable.It[], c?: CanvasRenderingContext2D): Generator<Renderable.It & { renderable: Renderable }> {
    const { scroll } = this
    for (const it of its) {
      const { renderables: rs, renderable: r } = it
      if (r) {
        if (c && r.scroll) {
          // c.restore()
          // c.save()
          scroll.add(r.scroll)//.translate(c)
          if (rs) yield* this.renderables(rs, c)
          yield it as any
          // c.restore()
          // c.save()
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
  dirty = new Map<Renderable, Dirty>()
  drawn: Dirty[] = []
  scroll: Point = $(new Point)
  draw(t = 1) {
    // const { Need: { Init, Render, Draw } } = Renderable
    const { dirty, drawn, scroll } = this
    const { canvas: { c }, screen: { pr } } = of(this.world)

    scroll.zero()

    let i = 0

    // c.save()

    for (const { renderable: r } of this.renderables(this.its, c)) {
      let d = dirty.get(r)
      if (d) {
        // c.restore()
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
        // c.save()
        // scroll.translate(c)
      }
      // TODO: The 'init' in r 'render' in r etc don't
      // need to be in the hot loop and can be done
      // at an earlier step.
      if (r.need & Need.Init) {
        if ('init' in r) r.init(r.canvas.c)
        else r.need ^= Need.Init
        r.need |= Need.Render
      }
      if (r.need & Need.Render) {
        if ('render' in r) r.render(r.canvas.c, t, true)
        else r.need ^= Need.Render
        r.need |= Need.Draw
      }
      if (r.need & Need.Draw) {
        if (r.draw) {
          r.draw(c, t, scroll)
          if (!d) {
            d = {
              owner: r,
              rect: $(new Rect(r.rect.size)),
            }
            dirty.set(r, d)
          }
          d.rect.setPos(r.rect).translateByPos(scroll)
          drawn[i++] = d
        }
        else r.need ^= Need.Draw
      }
    }
    // c.restore()

    // TODO: for the renderables that didn't draw, check if we drew
    // over their previous dirty rects and repeat the draws
  }
  get animatable() {
    $()
    const it = this
    // const { Need: { Init, Render, Draw } } = Renderable
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
        it.draw(t)
      }
    }
    return $(new RenderAnimatable)
  }
}
