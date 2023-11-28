// log.active
import { $, fn, of } from 'signal'
import { maybePush, maybeSplice } from 'utils'
import { Animable } from './animable.ts'
import { Rect } from './rect.ts'
import { Renderable } from './renderable.ts'
import { Scene } from './scene.ts'

const enum Debug {
  None = 0,
  Clear /*  */ = 1 << 0,
  Dirty /*  */ = 1 << 1,
  Visible /**/ = 1 << 2,
  Overlap /**/ = 1 << 3,
  Painted /**/ = 1 << 4,
  All = 127
}

export class Render extends Scene
  implements Renderable.It, Animable.It {
  debug = Debug.None //Overlap

  count = 0
  needDirect = false
  needDirectOne = false
  preferDirect = false

  view = $(new Rect)
  get visible() {
    return $(new Rect(this.view.size))
  }

  its: Renderable.It[] = []

  get shouldDirect() {
    const { preferDirect, needDirect } = this
    return preferDirect || needDirect
  }
  @fn add(it: Renderable.It) {
    maybePush(this.its, it)
    return this
  }
  @fn remove(it: Renderable.It) {
    maybeSplice(this.its, it)
    return this
  }
  get renderable() {
    $(); return $(new RenderRenderable(this), { copyRect: true })
  }
  get animable() {
    $(); return $(new RenderAnimable(this))
  }
}

class RenderRenderable extends Renderable {
  constructor(public it: Render) { super(it, false) }
  get its() {
    return this.it.its
  }
}

class RenderAnimable extends Animable {
  constructor(public it: Render) { super(it) }
  get debug() {
    return this.it.debug
  }
  tickOne(dt = 1) {
    const { its } = this.it.renderable
    for (const it of its) {
      it.renderable.dt = dt
    }
  }
  get itsToPaint() {
    const its = this.it.renderable.flatIts
    $()
    const rits = its.filter(({ renderable: r }) => {
      r.maybeInit
      if (!r.canPaint) {
        return (r.needDraw = false)
      }
      return true
    })
    $.flush()
    rits.forEach(({ renderable: r }) =>
      r.maybeInit
    )
    return rits
  }
  @fn draw(t = 1) {
    const { it, itsToPaint } = this
    const { shouldDirect } = it
    const { canvas } = of(it.ctx.world)

    canvas.clear()
    let count = 0
    for (const { renderable: r } of itsToPaint) {
      count++
      if (r.shouldPaint) {
        r.paint(canvas!.c, shouldDirect)
      }
    }

    if (shouldDirect) return
    this.need &= ~Animable.Need.Draw
  }
}
