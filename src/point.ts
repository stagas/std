import { $, alias, fn } from 'signal'
import { MatrixLike } from './matrix.ts'
import { Rect } from './rect.ts'
import { Shape } from './shape.ts'

export type PointLike = Point['json']

export class Point extends Shape {
  x = 0
  y = 0

  get json() {
    const { x, y } = this
    return { x, y }
  }
  get values() {
    const { x, y } = this
    return [x, y] as const
  }
  get whPx() {
    return {
      width: this.width + 'px',
      height: this.height + 'px',
    }
  }
  get wh() {
    const { width, height } = this
    return { width, height }
  }
  xy = alias(this, 'json')

  pr = 1
  get prX() { return this.x * this.pr }
  get prY() { return this.y * this.pr }
  get prScaled() {
    const { prX: x, prY: y } = $(this).$
    return $(new Point, { x, y })
  }

  left = alias(this, 'x')
  top = alias(this, 'y')
  right = alias(this, 'y')
  bottom = alias(this, 'x')

  l = alias(this, 'left')
  r = alias(this, 'right')
  t = alias(this, 'top')
  b = alias(this, 'bottom')

  w = alias(this, 'x')
  h = alias(this, 'y')

  width = alias(this, 'x')
  height = alias(this, 'y')

  col = alias(this, 'x')
  line = alias(this, 'y')
  get lineCol() {
    return this
  }
  @fn resizeToWindow() {
    this.w = window.innerWidth
    this.h = window.innerHeight
    return this
  }
  equals(o: PointLike | number) {
    if (typeof o === 'number') {
      return this.x === o && this.y === o
    }
    else {
      return this.x === o.x && this.y === o.y
    }
  }
  safe() {
    $.fx(() => {
      this.finite()
    })
    return this
  }
  copy() {
    const { x, y } = this
    return $(new Point, { x, y })
  }
  zero() {
    return this.set(0)
  }
  get ifNotZero(): this | undefined {
    if (!this.equals(0)) return this
  }
  @fn set(o: PointLike | number) {
    if (typeof o === 'number') {
      this.x = o
      this.y = o
    }
    else {
      this.x = o.x
      this.y = o.y
    }
    return this
  }
  @fn setFromEvent(o: { pageX: number, pageY: number }) {
    this.x = o.pageX
    this.y = o.pageY
    return this
  }
  @fn add(o: PointLike | number) {
    if (typeof o === 'number') {
      this.x += o
      this.y += o
    }
    else {
      this.x += o.x
      this.y += o.y
    }
    return this
  }
  @fn sub(o: PointLike | number) {
    if (typeof o === 'number') {
      this.x -= o
      this.y -= o
    }
    else {
      this.x -= o.x
      this.y -= o.y
    }
    return this
  }
  @fn div(o: PointLike | number) {
    if (typeof o === 'number') {
      this.x /= o
      this.y /= o
    }
    else {
      this.x /= o.x
      this.y /= o.y
    }
    return this
  }
  @fn mul(o: PointLike | number) {
    if (typeof o === 'number') {
      this.x *= o
      this.y *= o
    }
    else {
      this.x *= o.x
      this.y *= o.y
    }
    return this
  }
  @fn pow(o: PointLike | number) {
    if (typeof o === 'number') {
      this.x **= o
      this.y **= o
    }
    else {
      this.x **= o.x
      this.y **= o.y
    }
    return this
  }
  normalize() {
    return this.div(this.mag)
  }
  @fn finite() {
    const { x, y } = this
    this.x = !isFinite(x) ? 0 : x
    this.y = !isFinite(y) ? 0 : y
    return this
  }
  @fn floor() {
    const { x, y } = this
    this.x = Math.floor(x)
    this.y = Math.floor(y)
    return this
  }
  @fn ceil() {
    const { x, y } = this
    this.x = Math.ceil(x)
    this.y = Math.ceil(y)
    return this
  }
  @fn round() {
    const { x, y } = this
    this.x = Math.round(x)
    this.y = Math.round(y)
    return this
  }
  @fn neg() {
    const { x, y } = this
    this.x = -x
    this.y = -y
    return this
  }
  @fn sqrt() {
    const { x, y } = this
    this.x = Math.sqrt(x)
    this.y = Math.sqrt(y)
    return this
  }
  get angle() {
    const { x, y } = this
    return Math.atan2(y, x)
  }
  @fn angleShiftBy(angle: number, distance: number) {
    this.x += distance * Math.cos(angle)
    this.y += distance * Math.sin(angle)
    return this
  }
  get absSum() {
    const { x, y } = this
    return Math.abs(x) + Math.abs(y)
  }
  get sum() {
    const { x, y } = this
    return x + y
  }
  get mag() {
    const { x, y } = this
    return Math.sqrt(x * x + y * y)
  }
  chebyshev(o?: PointLike) {
    const { x, y } = this
    return Math.max(
      Math.abs(o?.x ?? x),
      Math.abs(o?.y ?? y)
    )
  }
  manhattan(o?: PointLike) {
    const { x, y } = this
    return Math.abs(o?.x ?? x)
      + Math.abs(o?.y ?? y)
  }
  distance(o: PointLike) {
    return this.temp.set(o).sub(this).mag
  }
  euclidean = alias(this, 'distance')
  @fn transformMatrix(m: MatrixLike) {
    const { a, b, c, d, e, f } = m
    const { x, y } = this
    this.x = a * x + c * y + e
    this.y = b * x + d * y + f
    return this
  }
  @fn transformMatrixInverse(m: MatrixLike) {
    const { a, b, c, d, e, f } = m
    const { x, y } = this

    const det = a * d - b * c

    if (det === 0) {
      throw new Error("Matrix is not invertible.")
    }

    const idet = 1 / det
    const invA = d * idet
    const invB = -b * idet
    const invC = -c * idet
    const invD = a * idet
    const invE = (c * f - e * d) * idet
    const invF = (e * b - a * f) * idet

    this.x = invA * x + invC * y + invE
    this.y = invB * x + invD * y + invF

    return this
  }
  @fn normalizeMatrix(m: MatrixLike) {
    // TODO: normalize skew (b c)
    const { a, b, c, d, e, f } = m
    const { x, y } = this
    this.x = (x - e) / a
    this.y = (y - f) / d
    return this
  }
  @fn lerp(o: PointLike, t: number) {
    const { x, y } = this
    this.x += (o.x - x) * t
    this.y += (o.y - y) * t
    return this
  }
  @fn rand(o?: PointLike | number, s = 1) {
    if (!o) o = 1
    if (typeof o === 'number') {
      this.x = (Math.random() ** s) * o
      this.y = (Math.random() ** s) * o
    }
    else {
      this.x = (Math.random() ** s) * o.x
      this.y = (Math.random() ** s) * o.y
    }
    return this
  }
  clear(c: CanvasRenderingContext2D) {
    const { w, h } = this
    c.clearRect(0, 0, w, h)
    return this
  }
  stroke(
    c: CanvasRenderingContext2D,
    color: string = this.strokeColor) {
    const { w, h } = this
    c.strokeStyle = color
    c.strokeRect(0, 0, w, h)
    return this
  }
  fill(
    c: CanvasRenderingContext2D,
    color: string = this.fillColor) {
    const { w, h } = this
    c.fillStyle = color
    c.fillRect(0, 0, w, h)
    return this
  }
  moveTo(c: CanvasRenderingContext2D) {
    const { x, y } = this
    c.moveTo(x, y)
    return this
  }
  lineTo(c: CanvasRenderingContext2D) {
    const { x, y } = this
    c.lineTo(x, y)
    return this
  }
  withinRect(r: Rect) {
    return r.isPointWithin(this)
  }
  touchPoint(other: Rect, center?: PointLike) {
    center ??= other.center
    // const self = this instanceof Rect ? this : new Point(1, 1)
    const i = temp.set(this)
      .intersectPoint(other, center)
      .sub(other.center)

    this.x = i.x //- self.width * 0.5
    this.y = i.y //- self.height * 0.5

    return this
  }
  intersectPoint(other: Rect, center?: PointLike) {
    center ??= other.center

    const w = other.w * 0.5
    const h = other.h * 0.5
    const d: Point = temp.set(center).add(other.center)

    // if A=B return B itself
    const tan_phi = h / w
    const tan_theta = Math.abs(d.y / d.x)

    // tell me in which quadrant the A point is
    const qx = Math.sign(d.x)
    const qy = Math.sign(d.y)

    let xI, yI

    if (tan_theta > tan_phi) {
      xI = (h / tan_theta) * qx
      yI = h * qy
    } else {
      xI = w * qx
      yI = w * tan_theta * qy
    }

    this.x = xI
    this.y = yI

    return this
  }
}

const temp = $(new Point)

//     randomInCircle = $.fn(function point_randomInCircle(
//       $, center: PointLike, radius: number): Point {
//       const diameter = radius * 2
//       $.x = center.x - radius + Math.random() * diameter
//       $.y = center.y - radius + Math.random() * diameter
//       return $._
//     })
//     drawText = $.fn(function point_drawText(
//       $,
//       c: CanvasRenderingContext2D,
//       text: string,
//       color?: string,
//       outlineWidth?: number,
//       outlineColor?: string): Point {
//       drawText(c, $, text, color, outlineWidth, outlineColor)
//       return $._
//     })
//   })
//   .local($ => class {

//   })
