// log.active
import { $, fn, of } from 'signal'
import { randomHex } from 'utils'
import { Context } from '../src/context.ts'
import { Point } from '../src/point.ts'
import { Rect } from '../src/rect.ts'
import { Renderable } from '../src/renderable.ts'
import { Scene } from '../src/scene.ts'

export class Box extends Scene {
  constructor(public ctx: Context, public pos: $<Point>) { super(ctx) }
  fixed = false
  get renderable() {
    $()
    const { pos, ctx: { world } } = this
    const { screen: { viewport } } = of(world)
    const s = Math.random() * 150 + 50
    const fillColor = '#' + randomHex() //3, '444', '477')
    return $(new BoxRenderable(this, $(new Rect(
      $($(new Point).set(s)),
      pos //$($(new Point).rand(viewport))
    ), {
      fillColor
    })))
  }
}

const pi2 = Math.PI * 2
class BoxRenderable extends Renderable {
  constructor(public it: Box, rect: $<Rect>) {
    super(it, true, $(rect.round()))
    this.canDirectDraw = !it.fixed
  }
  canDirectDraw = true
  phase = 0
  speed = Math.random() * 0.5
  @fn init(c: CanvasRenderingContext2D) {
    c.imageSmoothingEnabled = false
    c.lineWidth = 1.5 / this.pr
    c.strokeStyle = '#fff'
  }
  @fn draw(c: CanvasRenderingContext2D, point: Point) {
    let { it, rect, phase, speed } = this

    // if (clear) {
    c.save()
    point.translate(c)
    rect.pos.translateNegative(c)
    rect.fill(c)
    c.restore()
    // }
    // c.save()
    // c.beginPath()
    // const { w, hh } = rect
    // c.translate(0, hh)
    // c.moveTo(0, hh)
    // for (let x = 1; x < w; x += 6) {
    //   c.lineTo(x, hh * Math.sin(phase))
    //   phase += speed
    // }
    // c.stroke()
    // c.restore()
    // this.phase = phase % pi2
    // if (it.fixed) this.need &= ~Renderable.Need.Render
    // this.need |= Renderable.Need.Draw
  }
  // draw(c: CanvasRenderingContext2D, t: number, scroll: Point) {
  //   const { it, canvas, rect, pr } = this
  //   rect.round().drawImageTranslated(
  //     canvas.el,
  //     c,
  //     pr,
  //     true,
  //     scroll
  //   )

  //   if (it.fixed) this.need &= ~Renderable.Need.Draw
  // }
}
