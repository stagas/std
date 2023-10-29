// log.active
import { $, fn, fx, of, when } from 'signal'
import { Circle } from '../src/circle.ts'
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
  constructor(public it: Ball) { super(it.ctx) }
  @fx setup() {
    const { it } = this
    const { hasSize } = when(it.circle.rect)
    $()
    it.circle.lerpPos.p1.set(it.pos).round()
    it.circle.lerpPos.p2.set(it.pos).round()
  }
  @fn init(c: CanvasRenderingContext2D) {
    const { Need: { Init } } = Renderable
    c.imageSmoothingEnabled = false
    this.need ^= Init
  }
  @fn render(c: CanvasRenderingContext2D) {
    const { Need: { Render } } = Renderable
    const { it } = this
    const { circle } = it
    const { radius: r } = circle
    c.save()
    c.translate(r, r)
    circle.fill(c)
    c.restore()
    this.need ^= Render
  }
  @fn draw(c: CanvasRenderingContext2D, t: number) {
    const { it, canvas, rect, pr, dirtyRects: [dr] } = of(this)
    it.circle.lerpPos.lerp(t)
    rect.center.set(it.circle.lerpPos.lerpPoint.round())
    rect.round().drawImage(canvas.el, c, pr, true)
    dr.set(rect)
  }
}
