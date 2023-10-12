import { $, alias, fx } from 'signal'
import { Rect } from './rect.ts'
import { Point, PointLike } from './point.ts'
import { Shape } from './shape.ts'

const d = $(new Point)

export class Circle extends Shape {
  static toCircleCollision(c1: Circle, c2: Circle, tolerance = 0) {
    const { pos: p1, radius: r1 } = c1
    const { pos: p2, radius: r2 } = c2
    const radius = r1 + r2
    d.set(p1).sub(p2)
    const diff = (radius + tolerance) - d.mag
    if (diff > 0) {
      d.mul(diff / radius)
      return d
    }
  }
  static toCircleCollisionReverse(c1: Circle, c2: Circle, tolerance = 0) {
    const { pos: p1, radius: r1 } = c1
    const { pos: p2, radius: r2 } = c2
    const radius = r1 + r2
    d.set(p2).sub(p1)
    const diff = (d.mag + tolerance) - radius
    if (diff > 0) {
      d.mul(diff / radius)
      return d
    }
  }

  rect = $(new Rect)
  radius = 10
  pos = this.rect.$.center
  center = alias(this, 'pos')

  @fx init() {
    this.rect.width = this.rect.height = this.radius * 2
  }
  // get rect() {
  //   $.ignore()
  //   const r = $(new Rect, {
  //     pos: $(this).$.pos
  //   })
  //   // r.pos =
  //   return r
  // }
  isPointWithin(p: PointLike) {
    const { pos, radius } = this
    return pos.distance(p) < radius
  }
  fill(c: CanvasRenderingContext2D): void {
    const { fillColor: color, pos, radius } = this
    c.beginPath()
    c.fillStyle = color
    c.arc(pos.x, pos.y, radius, 0, Math.PI * 2, true)
    c.fill()
  }
}
