// log.active
import { $, fn, of } from 'signal'
import { randomHex } from 'utils'
import { Context } from '../src/context.ts'
import { Point } from '../src/point.ts'
import { Rect } from '../src/rect.ts'
import { Need, Renderable } from '../src/renderable.ts'
import { Scene } from '../src/scene.ts'

export class Box extends Scene {
  constructor(public ctx: Context, public pos: $<Point>) { super(ctx) }
  get renderable() {
    $()
    const { pos, ctx: { world } } = this
    const { screen: { viewport } } = of(world)
    const s = Math.random() * 150 + 50
    const fillColor = '#' + randomHex(3, '444', '477')
    return $(new BoxRenderable(this.ctx, $(new Rect(
      $($(new Point).set(s)),
      pos //$($(new Point).rand(viewport))
    ), {
      fillColor
    })))
  }
}

class BoxRenderable extends Renderable {
  need = Need.Render
  @fn render(c: CanvasRenderingContext2D) {
    const { rect } = this
    c.save()
    rect.pos.translateNegative(c)
    rect.fill(c)
    c.restore()
    this.need ^= Need.Render
  }
  draw(c: CanvasRenderingContext2D, t: number, scroll: Point) {
    const { canvas, rect, pr } = this
    // rect.round().stroke(c, this.rect.fillColor) //
    rect.round()
      .drawImageTranslated(
        canvas.el,
        c,
        pr,
        true,
        scroll
      )
  }
}
