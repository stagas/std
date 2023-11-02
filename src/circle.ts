import { $, alias, init } from 'signal'
import { Line } from './line.ts'
import { Point, PointLike } from './point.ts'
import { Rect } from './rect.ts'
import { Shape } from './shape.ts'

const d = $(new Point)
const v = $(new Point)

export class Circle extends Shape {
  static toCircleCollision(
    c1: { circle: Circle, vel: Point, mass: number },
    c2: { circle: Circle, vel: Point, mass: number },
    tolerance = 0
  ) {
    const { pos: p1, radius: r1 } = c1.circle
    const { pos: p2, radius: r2 } = c2.circle
    const radius = r1 + r2
    d.set(p1).sub(p2)
    const dist = d.mag
    const diff = (radius + tolerance) - dist
    if (diff > 0) {
      // normalize
      d.div(dist)

      // relative velocity
      v.set(c1.vel).sub(c2.vel)

      // Calculate relative speed along the normal vector
      const relSpeed = v.x * d.x + v.y * d.y

      // If the circles are moving away from each other, do nothing
      if (relSpeed > 0) return

      // Calculate impulse (change in momentum)
      const impulse = ((2 * relSpeed) / (c1.mass + c2.mass)) * 0.98

      // Apply the impulse to update velocities
      c1.vel.x -= impulse * c2.mass * d.x
      c1.vel.y -= impulse * c2.mass * d.y
      c2.vel.x += impulse * c1.mass * d.x
      c2.vel.y += impulse * c1.mass * d.y

      // Separate the circles to avoid overlap
      const sx = diff * d.x * 0.5
      const sy = diff * d.y * 0.5

      c1.circle.pos.x += sx
      c1.circle.pos.y += sy

      c2.circle.pos.x -= sx
      c2.circle.pos.y -= sy
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

  constructor(
    public rect = $(new Rect),
    public pos = rect.$.center,
  ) { super() }

  radius = 10
  prevPos = $(new Point)
  lerpPos = $(new Line)
  center = alias(this, 'pos')

  @init initRectSize() {
    this.rect.width = this.rect.height = Math.ceil(this.radius * 2)
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
  lerpFill(c: CanvasRenderingContext2D): void {
    const { fillColor: color, lerpPos: { lerpPoint: pos }, radius } = this
    c.beginPath()
    c.fillStyle = color
    c.arc(pos.x, pos.y, radius, 0, Math.PI * 2, true)
    c.fill()
  }
  fill(c: CanvasRenderingContext2D): void {
    const { fillColor: color, pos, radius } = this
    c.beginPath()
    c.fillStyle = color
    c.arc(pos.x, pos.y, radius, 0, Math.PI * 2, true)
    c.fill()
  }
}
