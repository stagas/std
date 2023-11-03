// log.active
import { $, fn, fx, of } from 'signal'
import { maybePush, maybeSplice, poolArrayGet, randomHex } from 'utils'
import { Animable } from './animable.ts'
import { mergeRects } from './clip.ts'
import { FixedArray } from './fixed-array.ts'
import { Overlap } from './overlap.ts'
import { Point } from './point.ts'
import { Rect } from './rect.ts'
import { Renderable } from './renderable.ts'
import { World } from './world.ts'

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
  private *traverse(
    its: Renderable.It[],
    c?: CanvasRenderingContext2D,
    // depth = 0,
  ): Generator<Renderable.It> {
    const { scroll } = this
    for (const it of its) {
      const { renderable: r } = it
      r.dirty.index = this.index.value++
      // r.dirty.depth = depth
      if (c && r.scroll) {
        // r.before?.(c)
        scroll.add(r.scroll).round()
        if (r.its) yield* this.traverse(r.its, c) //, depth + 1)
        scroll.sub(r.scroll).round()
        yield it as any
        // r.after?.(c)
      }
      else {
        // if (c) r.before?.(c)
        if (r.its) yield* this.traverse(r.its, c) //, depth + 1)
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
      @fn initRender(r: Renderable, t: number) {
        if (r.need & Renderable.Need.Init) {
          if (r.init) {
            r.init(r.canvas.c)
          }
          else {
            r.need &= ~Renderable.Need.Init
            if (r.render) {
              r.need |= Renderable.Need.Render
            }
          }
        }

        if (r.need & Renderable.Need.Render) {
          if (r.render) {
            r.render(r.canvas.c, t, true)
          }
          else {
            r.need &= ~Renderable.Need.Render
          }
        }
      }
      @fn directDraw(t = 1) {
        const { canvas: { c } } = of(it.world)

        const {
          scroll,
          visible,
          drawing,
          prev,
        } = it

        drawing.clear()
        scroll.zero()

        for (const r of prev) {
          if ((r.draw ?? r.canDirectDraw)) { //} && !drawing.has(r)) {
            r.dirty.clear(c)
            // r.isVisible = false
            // r.need = 0
          }
        }

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

        // for (const r of drawing) {
        //   if (r.draw ?? r.canDirectDraw) {
        //     r.dirty.clear(c)
        //   }
        // }


        for (const r of prev) {
          if ((r.draw ?? r.canDirectDraw) && !drawing.has(r)) {
            // r.dirty.clear(c)
            r.isVisible = false
            r.need = 0
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

            r.dirty.rect.set(r.view)
            // always need the renderable to re-init/render
            // after the direct draws finish.
            // r.need |= Renderable.Need.Init // | Renderable.Need.Draw
          }
          else {
            this.initRender(r, t)

            if (r.draw) {
              r.draw(c, t, r.dirty.scroll)
              r.dirty.rect.set(r.view)
              // r.need |= Renderable.Need.Init //Render | Renderable.Need.Draw
            }
            else {
              r.need &= ~Renderable.Need.Draw
            }
          }
        }

        // swap the sets
        it.prev = drawing
        it.drawing = prev

        if (!this.active) {
          this.need &= ~Animable.Need.Draw
        }
      }
      @fn draw(t = 1) {
        if (it.needDirect) {
          it.wasDirect = true
          this.directDraw(t)
          return
        }

        const { canvas: { c, rect }, screen: { pr } } = of(it.world)

        const {
          scroll,
          visible,

          clearing,
          stationary,
          drawing,
          drawn,
          prev,
          overlaps,
          redraws,
        } = it

        clearing.clear()
        drawing.clear()
        drawn.clear()
        stationary.clear()

        scroll.zero()

        if (it.wasDirect) {
          // visible.clear(c)
          for (const r of prev) {
            if ((r.draw ?? r.canDirectDraw)) { //} && !drawing.has(r)) {
              r.dirty.clear(c).stroke(c, '#' + randomHex())
              // r.isVisible = false
              // r.need = 0
            }
          }
          // prev.clear()
          // rect.clear(c)
          for (const { renderable: r } of Renderable.traverse(it.its)) {
            r.need |= Renderable.Need.Init
          }
          it.wasDirect = false
          // return
        }

        // traverse all renderables depth-first
        it.index.value = 0
        for (const { renderable: r } of it.traverse(it.its, c)) {
          // if (!r.init && !r.render && !r.draw) continue

          // check if this renderable is visible
          const isVisible = !r.isHidden && sr.set(r.view)
            .translate(scroll)
            .intersectsRect(visible)

          // console.log(r.view.text, visible.text)

          if (!r.isVisible) {
            if (!isVisible) {
              r.dirty.rect.zero()
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
              // so we need to clear it. Note this
              // applies to items that are still in the tree.
              // Items that are not in this tree
              // are handled at the next step using `prev`.
              if (r.draw) {
                clearing.add(r)
              }
              r.isVisible = false
              r.need = 0
              continue
            }
          }

          this.initRender(r, t)

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
              r.dirty.nextScroll.set(scroll)
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

        // mark items that are no longer in the tree
        // as not visible and clear them
        for (const r of prev) {
          if (!drawing.has(r)) {
            clearing.add(r)
            r.isVisible = false
            r.need = 0
          }
        }

        // clear what was visible before, but is not visible now
        // and anything that is about to draw
        for (const r of clearing) {
          r.dirty.clear(c)
        }

        // gather overlaps with what has cleared and
        // the stationary items, so they are redrawn
        for (const other of clearing) {
          for (const r of stationary) {
            if (other === r) continue
            // if (other.dirty.index <= r.dirty.index) continue
            const overlap = other.dirty.overlapWith(r.dirty)
            if (overlap) {
              poolArrayGet(
                r.dirty.redrawing.array,
                r.dirty.redrawing.count++,
                Rect.create
              ).set(overlap)
            }
          }
        }

        // draw scheduled
        for (const r of drawing) {
          r.dirty.scroll.set(r.dirty.nextScroll)

          if (stationary.has(r)) {
            redraws.count
              = overlaps.count
              = 0

            for (const other of drawn) {
              if (other === r) continue

              // get overlaps, clear them, and redraw in order
              const overlap = poolArrayGet(
                overlaps.array,
                overlaps.count,
                Overlap.create
              )
              overlap.d1 = other.dirty
              overlap.d2 = r.dirty
              if (overlap.update()) {
                overlaps.count++
                overlap.rect.clear(c)
                redraws.push(overlap.rect)
              }
            }

            for (let i = 0; i < r.dirty.redrawing.count; i++) {
              r.dirty.redrawing.array[i].clear(c)
              redraws.push(r.dirty.redrawing.array[i])
            }
            r.dirty.redrawing.count = 0

            for (let i = 0, overlap: Overlap; i < overlaps.count; i++) {
              overlap = overlaps.array[i]
              overlap.rect.drawImageNormalizePosTranslated(
                overlap.d1!.owner.canvas.el,
                c,
                pr,
                sr.set(overlap.d1!.rect)
                  .translateByPos(overlap.d1!.scroll),
                overlap.d1!.scroll
              )
            }

            const results = mergeRects(redraws.array, redraws.count)
            for (let i = 0; i < results.count; i++) {
              results.array[i].drawImageNormalizePosTranslated(
                r.dirty.owner.canvas.el,
                c,
                pr,
                sr.set(r.dirty.rect)
                  .translateByPos(r.dirty.scroll),
                r.dirty.scroll
              )
            }
          }
          else {
            r.dirty.clear(c)

            for (const other of drawn) {
              r.dirty.redrawOverlap(other.dirty, c, pr, other.dirty.scroll)
            }

            r.draw!(c, t, r.dirty.scroll)

            r.dirty.rect.set(r.view) //.stroke(c, '#' + randomHex())
          }
          drawn.add(r)
        }

        // swap the sets
        it.prev = drawing
        it.drawing = prev

        // console.log(drawing.size)

        if (!this.active) {
          this.need &= ~Animable.Need.Draw
        }
      }
    }
    return $(new RenderAnimable(it as Animable.It))
  }
}
