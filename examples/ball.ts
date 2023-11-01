// log.active
import { $, fn, fx, of, when } from 'signal'
import { whenNot } from 'signal/src/signal-core.ts'
import { Circle } from '../src/circle.ts'
import { Need } from '../src/need.ts'
import { Point } from '../src/point.ts'
import { Renderable } from '../src/renderable.ts'
import { Scene } from '../src/scene.ts'

export class Ball extends Scene {
  circle = $(new Circle)
  radius = this.circle.$.radius
  pos = this.circle.rect.center
  x = this.pos.$.x
  y = this.pos.$.y
  left = this.circle.rect.$.left
  top = this.circle.rect.$.top
  right = this.circle.rect.$.right
  bottom = this.circle.rect.$.bottom

  coeff = 1
  get mass() { return 1.3 + (this.circle.rect.size.mag * 0.025) * this.coeff }
  get impactAbsorb() { return ((1 / this.mass) ** 0.25) * 0.919 }
  vel = $(new Point)
  colls = new Set<Ball>() //

  get renderable() {
    $()
    return $(new BallRenderable(this), {
      rect: { size: this.circle.rect.size.xy }
    })
  }
}

class BallRenderable extends Renderable {
  constructor(public it: Ball) { super(it) }
  need = Need.Render
  @fx setup() {
    const { it } = this
    const { hasSize } = when(it.circle.rect)
    $()
    it.circle.lerpPos.p1.set(it.pos).round()
    it.circle.lerpPos.p2.set(it.pos).round()
  }
  @fx update_pos_when_not_visible() {
    const { isVisible } = whenNot(this)
    const { it } = this
    const { pos } = it
    const { x, y } = pos
    $()
    this.rect.center.set(pos)
  }
  @fn init(c: CanvasRenderingContext2D) {
    c.imageSmoothingEnabled = false
    this.need ^= Need.Init
  }
  @fn render(c: CanvasRenderingContext2D) {
    const { it } = this
    const { circle } = it
    const { radius: r } = circle
    c.save()
    c.translate(r, r)
    circle.fill(c)
    c.restore()
    this.need ^= Need.Render
    this.need |= Need.Draw
  }
  @fn draw(c: CanvasRenderingContext2D, t: number, scroll: Point) {
    const { it, canvas, rect, pr } = of(this)
    it.circle.lerpPos.lerp(t)
    rect.center.set(it.circle.lerpPos.lerpPoint)
    rect.round().drawImageTranslated(
      canvas.el,
      c,
      pr,
      true,
      scroll
    )
    // console.log('yo')
  }
}
