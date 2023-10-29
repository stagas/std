// log.active
import { $, fn, fx, of } from 'signal'
import { randomHex } from 'utils'
import { Animatable } from '../src/animatable.ts'
import { Point } from '../src/point.ts'
import { Rect } from '../src/rect.ts'
import { Renderable } from '../src/renderable.ts'
import { Scene } from '../src/scene.ts'

export class Box extends Scene {
  get renderable() {
    $()
    const { ctx: { world } } = this
    const { screen: { viewport } } = of(world)
    const s = Math.random() * 300 + 100
    return $(new BoxRenderable(this.ctx, $(new Rect(
      $($(new Point).set(s)),
      $($(new Point).rand(viewport))
    ), {
      fillColor: '#' + randomHex()
    })))
  }
  get animatable() {
    $()
    class BoxAnimatable extends Animatable {
      need = Animatable.Need.Tick
    }
    return $(new BoxAnimatable)
  }
}

class BoxRenderable extends Renderable {
  need = Renderable.Need.Render
  @fn render(c: CanvasRenderingContext2D) {
    const { rect } = this
    rect.fill(c)
    this.need ^= Renderable.Need.Render
  }
  @fn draw(c: CanvasRenderingContext2D) {
    const { canvas, rect, pr, dirtyRects: [dr] } = this
    rect.round().drawImage(canvas.el, c, pr, true)
    dr.set(rect)
  }
}
