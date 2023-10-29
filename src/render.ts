// log.active
import { $, fn, fx, of } from 'signal'
import { maybePush, maybeSplice } from 'utils'
import { Animatable } from './animatable.ts'
import { Renderable } from './renderable.ts'
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
  }
  @fn remove(it: Renderable.It) {
    maybeSplice(this.its, it)
  }
  *renderables(its: Renderable.It[], c?: CanvasRenderingContext2D): Generator<Renderable.It & { renderable: Renderable }> {
    const { scroll } = this
    for (const it of its) {
      const { renderables: rs, renderable: r } = it
      if (r) {
        if (c && r.scroll) {
          c.restore()
          c.save()
          scroll.add(r.scroll).translate(c)
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
  dirty = new Map<Renderable, Dirty>()
  drawn: Dirty[] = []
  scroll: Point = $(new Point)
  @fn draw(t = 1) {
    const { Need: { Init, Render, Draw } } = Renderable
    const { dirty, drawn, scroll } = this
    const { canvas: { c }, screen: { pr } } = of(this.world)

    scroll.zero()

    let i = 0

    c.save()

    for (const { renderable: r } of this.renderables(this.its, c)) {
      let d = dirty.get(r)
      if (d) {
        c.restore()
        d.rect.clear(c)
        for (let j = 0, other: Dirty; j < i; j++) {
          other = drawn[j]
          d.rect.intersectionRect(other.rect)
            ?.drawImageNormalizePos(
              other.owner.canvas.el,
              c,
              pr,
              other.rect
            )
        }
        c.save()
        scroll.translate(c)
      }
      // TODO: The 'init' in r 'render' in r etc don't
      // need to be in the hot loop and can be done
      // at an earlier step.
      if (r.need & Init) {
        if ('init' in r) r.init(r.canvas.c)
        else r.need ^= Init
        r.need |= Render
      }
      if (r.need & Render) {
        if ('render' in r) r.render(r.canvas.c, t, true)
        else r.need ^= Render
        r.need |= Draw
      }
      if (r.need & Draw) {
        if ('draw' in r) {
          r.draw(c, t)
          if (!d) {
            d = {
              owner: r,
              rect: $(new Rect),
            }
            dirty.set(r, d)
          }
          d.rect.set(r.rect).translate(scroll)
          drawn[i++] = d
        }
        else r.need ^= Draw
      }
    }
    c.restore()

    // TODO: for the renderables that didn't draw, check if we drew
    // over their previous dirty rects and repeat the draws
  }
  get animatable() {
    $()
    const it = this
    const { Need: { Init, Render, Draw } } = Renderable
    class RenderAnimatable extends Animatable {
      @fx trigger_draw() {
        let pass = 0
        for (const { renderable: r } of it.renderables(it.its)) {
          pass |= r.need
        }
        if (pass & (Render | Draw)) {
          $()
          this.need |= Animatable.Need.Draw
        }
      }
      @fn draw(t: number) {
        it.draw(t)
      }
    }
    return $(new RenderAnimatable)
  }
}
