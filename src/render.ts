log.active
import { $, fn, fx, of } from 'signal'
import { maybePush, maybeSplice } from 'utils'
import { Animatable } from './animatable.ts'
import { DirtyRect, Renderable } from './renderable.ts'
import { World } from './world.ts'

export class Render {
  constructor(public world: World) { }
  its: Renderable.It[] = []
  @fn add(it: Renderable.It) {
    maybePush(this.its, it)
  }
  @fn remove(it: Renderable.It) {
    maybeSplice(this.its, it)
  }
  *renderables(its: Renderable.It[]): Generator<Renderable.It> {
    for (const it of its) {
      const { renderables: rs } = it
      if (rs) yield* this.renderables(rs)
      yield it
    }
  }
  drawn: DirtyRect[] = []
  @fn draw(t = 1) {
    const { Need: { Init, Render, Draw } } = Renderable
    const { drawn } = this
    const { canvas: { c }, screen: { pr } } = of(this.world)

    let i = 0
    for (const { renderable: r } of this.renderables(this.its)) {
      const dirty = r.dirtyRects
      for (const dr of dirty) {
        dr.clear(c)
        for (let j = 0, otherRect: DirtyRect; j < i; j++) {
          otherRect = drawn[j]
          dr.intersectionRect(otherRect)
            ?.drawImageNormalizePos(
              otherRect.owner.canvas.el,
              c,
              pr,
              otherRect
            )
        }
        dr.zero()
      }
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
        if ('draw' in r) r.draw(c, t)
        else r.need ^= Draw
      }
      for (const dr of r.dirtyRects) {
        if (i === drawn.length) drawn.push(dr)
        else drawn[i] = dr
        i++
      }
    }

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
