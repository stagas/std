// log.active
import { $, fn, fx, of, when, whenNot } from 'signal'
import { Circle } from '../src/circle.ts'
import { Point } from '../src/point.ts'
import { Renderable } from '../src/renderable.ts'
import { Scene } from '../src/scene.ts'

export class Ball extends Scene
  implements Renderable.It {
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
    const it = this
    return $(new BallRenderable(it), {
      rect: { size: this.circle.rect.size.xy }
    })
  }
}

class BallRenderable extends Renderable {
  // canDirectDraw = true
  // fillStyle = '#000'
  // clearBeforeRender = false
  constructor(public it: Ball) { super(it) }
  @fx setup() {
    const { it } = this
    const { hasSize } = when(it.circle.rect)
    $()
    it.circle.lerpPos.p1.set(it.pos).round()
    it.circle.lerpPos.p2.set(it.pos).round()
    // this.need |= Renderable.Need.Draw
  }
  @fx update_pos_when_not_visible() {
    const { isVisible } = whenNot(this)
    const { it } = this
    const { pos } = it
    const { x, y } = pos
    $()
    this.rect.center.set(pos)
    // this.need |= Renderable.Need.Draw
  }
  @fn init(c: CanvasRenderingContext2D) {
    c.imageSmoothingEnabled = false
  }
  @fn draw(c: CanvasRenderingContext2D, point: Point) {
    const { it, view } = this
    const { circle } = it
    const { radius: r } = circle
    c.save()
    // console.log(point.text)
    // point.translate(c)
    // c.translate(r, r)
    // it.circle.lerpPos.lerp(1)
    // circle.lerpPos.lerpPoint.translateNegative(c)
    // view.center.set(it.circle.lerpPos.lerpPoint)
    // console.log(circle.pos.text)
    // circle.fill(c)
    view.center.set(circle.pos)
    // console.log(point.text)
    point.sub(circle.pos).add(r).translate(c)
    circle.fill(c)
    // c.fillStyle = '#f00'
    // c.fillRect(0, 0, 100, 100)
    // view.fill(c, '#f00').stroke(c, '#f00')
    // console.log(this.isVisible)


    // view.center.set(it.circle.pos).fill(c, '#f00')
    c.restore()
  }
  // @fn draw(c: CanvasRenderingContext2D, t: number, scroll: Point) {
  //   const { it, canvas, rect, pr } = of(this)
  //   it.circle.lerpPos.lerp(t)
  //   rect.center.set(it.circle.lerpPos.lerpPoint)
  //   rect.round().drawImageTranslated(
  //     canvas.el,
  //     c,
  //     pr,
  //     true,
  //     scroll
  //   )
  // }
}
