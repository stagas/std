// log.active
import { $, fn, fx, of } from 'signal'
import { maybePush, maybeSplice, poolArrayGet, randomHex } from 'utils'
import { Animable } from './animable.ts'
import { FixedArray } from './fixed-array.ts'
import { Overlap } from './overlap.ts'
import { Point } from './point.ts'
import { Rect } from './rect.ts'
import { Renderable } from './renderable.ts'
import { World } from './world.ts'
import { mergeRects } from './clip.ts'

function clip(rectA: Rect, rectB: Rect) {
  let rectangles = []

  if (rectA.y < rectB.y) {
    rectangles.push($(new Rect, { x: rectA.x, y: rectA.y, w: rectA.w, h: rectB.y - rectA.y }))
  }
  if (rectA.x < rectB.x) {
    rectangles.push($(new Rect, { x: rectA.x, y: Math.max(rectA.y, rectB.y), w: rectB.x - rectA.x, h: Math.min(rectA.y + rectA.h, rectB.y + rectB.h) - Math.max(rectA.y, rectB.y) }))
  }
  if (rectA.x + rectA.w > rectB.x + rectB.w) {
    rectangles.push($(new Rect, { x: rectB.x + rectB.w, y: Math.max(rectA.y, rectB.y), w: (rectA.x + rectA.w) - (rectB.x + rectB.w), h: Math.min(rectA.y + rectA.h, rectB.y + rectB.h) - Math.max(rectA.y, rectB.y) }))
  }
  if (rectA.y + rectA.h > rectB.y + rectB.h) {
    rectangles.push($(new Rect, { x: rectA.x, y: rectB.y + rectB.h, w: rectA.w, h: (rectA.y + rectA.h) - (rectB.y + rectB.h) }))
  }

  return rectangles
}

function simplifyOverlappingRectangles(rectangles: Rect[]): Rect[] {
  rectangles.sort((a, b) => a.x - b.x)

  let simplifiedRects: Rect[] = []
  let activeRects: Rect[] = []

  for (let i = 0; i < rectangles.length; i++) {
    let currentRect = rectangles[i]

    // Remove rectangles that are to the left of the current rectangle
    activeRects = activeRects.filter(rect => rect.x + rect.w > currentRect.x)

    // Check for overlaps with the active rectangles
    for (let j = 0; j < activeRects.length; j++) {
      let overlapRect = activeRects[j]
      if (currentRect.y < overlapRect.y + overlapRect.h && currentRect.y + currentRect.h > overlapRect.y) {
        // The rectangles overlap, adjust the current rectangle
        if (currentRect.y < overlapRect.y) {
          currentRect.h = overlapRect.y - currentRect.y
        } else {
          currentRect.y = overlapRect.y + overlapRect.h
          currentRect.h = (currentRect.y + currentRect.h) - (overlapRect.y + overlapRect.h)
        }
      }
    }

    // Add the current rectangle to the list of active rectangles
    activeRects.push(currentRect)

    // If the current rectangle still has height, add it to the simplified rectangles
    if (currentRect.h > 0) {
      simplifiedRects.push(currentRect)
    }
  }

  return simplifiedRects
}

function simplifyRectangles(rects: Rect[]): Rect[] {
  // Sort rectangles by x-coordinate
  rects.sort((a, b) => a.x - b.x)

  const results: Rect[] = []

  for (let i = 0; i < rects.length - 1; i++) {
    const a = rects[i]
    const b = rects[i + 1]

    let dx = a.right - b.x
    if (dx > 0) {
      console.log(dx)
      if (a.w > dx) {
        results.push(Rect.create().setParameters(
          a.right,
          a.y,
          dx,
          a.h,
        ))
        a.w -= dx
      }
    }
    else {
      results.push(a)
    }
  }
  return results
}

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
            overlaps.count = 0

            const rects = []

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
                rects.push(overlap.rect)
              }
            }


            for (let i = 0; i < r.dirty.redrawing.count; i++) {
              r.dirty.redrawing.array[i].clear(c)
              rects.push(r.dirty.redrawing.array[i])
            }


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
              // rects.push(overlap.rect)
              // r.dirty.redrawing.push(overlap.rect)
            }

            // function simplify(overlaps: Rect[], count: number) {
            //   for (let i = 0; i < count - 1; i++) {
            //     const a = overlaps[i]
            //     const b = overlaps[i + 1]
            //     if (a.intersectsRect(b)) {
            //       // Adjust the width of the first rectangle
            //       a.w = b.x - a.x

            //       // If the first rectangle completely encompasses the second one,
            //       // adjust its height as well
            //       if (a.y < b.y && a.y + a.h > b.y + b.h) {
            //         a.h = b.y - a.y
            //       }
            //     }
            //     a.stroke(c, '#0f0')
            //   }
            // }


            const results = mergeRects(rects)
            // rects.sort((a, b) => a.y - b.y)

            // const results: Rect[] = []
            // for (let i = 0; i < rects.length; i++) {
            //   for (let j = 0; j < rects.length; j++) {
            //     results.push(...clip(rects[i], rects[j]))
            //   }
            // }
            // const results = simplifyRectangles(rects)

            for (const rect of results) {
              rect.drawImageNormalizePosTranslated(
                r.dirty.owner.canvas.el,
                c,
                pr,
                sr.set(r.dirty.rect)
                  .translateByPos(r.dirty.scroll),
                r.dirty.scroll
              )
              // rect.stroke(c, '#' + randomHex())
            }


            // for (let i = 0, overlap: Overlap; i < overlaps.count; i++) {
            //   overlap = overlaps.array[i]
            //   overlap.rect.drawImageNormalizePosTranslated(
            //     overlap.d2!.owner.canvas.el,
            //     c,
            //     pr,
            //     sr.set(overlap.d2!.rect)
            //       .translateByPos(overlap.d2!.scroll),
            //     overlap.d2!.scroll
            //   )
            //   // overlap.rect.stroke(c, '#0f0')
            // }

            // for (let i = 0; i < r.dirty.redrawing.count; i++) {
            //   r.dirty.redrawing.array[i].drawImageNormalizePosTranslated(
            //     r.dirty.owner.canvas.el,
            //     c,
            //     pr,
            //     sr.set(r.dirty.rect)
            //       .translateByPos(r.dirty.scroll),
            //     r.dirty.scroll
            //   )
            // }

            r.dirty.redrawing.count = 0

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
