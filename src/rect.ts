import { $, alias, fn } from 'signal'
import { MatrixLike } from './matrix.ts'
import { Point, PointLike } from './point.ts'
import { Shape } from './shape.ts'
import { Line } from './line.ts'

export type RectLike = Rect['json']

export class Rect extends Shape {
  static create() { return $(new Rect) }
  static pathAround(c: CanvasRenderingContext2D, rects: Rect[], count: number) {
    let r = rects[0]
    c.moveTo(r.left, r.top)
    c.lineTo(r.right, r.top)
    c.lineTo(r.right, r.bottom)
    let n = 1
    for (; n < count; n++) {
      r = rects[n]
      c.lineTo(r.right, r.top)
      c.lineTo(r.right, r.bottom)
    }
    --n
    for (; n >= 0; n--) {
      r = rects[n]
      c.lineTo(r.left, r.bottom)
      c.lineTo(r.left, r.top)
    }
  }
  static pathAroundLeft(c: CanvasRenderingContext2D, rects: Rect[], count: number) {
    let r = rects[count - 1]
    c.moveTo(r.left, r.bottom)
    c.lineTo(r.left, r.top)
    let n = count - 2
    for (; n >= 0; n--) {
      r = rects[n]
      c.lineTo(r.left, r.bottom)
      c.lineTo(r.left, r.top)
    }
    c.lineTo(r.right, r.top)
  }
  static pathAroundRight(c: CanvasRenderingContext2D, rects: Rect[], count: number) {
    let r = rects[0]
    c.moveTo(r.right, r.top)
    c.lineTo(r.right, r.bottom)
    let n = 1
    for (; n < count; n++) {
      r = rects[n]
      c.lineTo(r.right, r.top)
      c.lineTo(r.right, r.bottom)
    }
    c.lineTo(r.left, r.bottom)
  }

  constructor(
    public size = $(new Point),
    public pos = $(new Point),
    public x = pos.$.x,
    public y = pos.$.y,
    public w = size.$.w,
    public h = size.$.h,
  ) { super() }

  get json() {
    const { x, y, w, h } = this
    return { x, y, w, h }
  }
  get values() {
    const { x, y, w, h } = this
    return [x, y, w, h] as const
  }

  // col = alias(this, 'x')
  // line = alias(this, 'y')
  // lineCol = alias(this, 'pos')

  width = alias(this, 'w')
  height = alias(this, 'h')

  left = alias(this, 'x')
  top = alias(this, 'y')
  get right() { return this.x + this.w }
  set right(r: number) { this.x = r - this.w }
  get bottom() { return this.y + this.h }
  set bottom(b: number) { this.y = b - this.h }

  l = alias(this, 'x')
  t = alias(this, 'y')
  r = alias(this, 'right')
  b = alias(this, 'bottom')

  leftTop = alias(this, 'pos')
  get rightTop() {
    const { right: x, top: y } = $(this).$
    return $(new Point, { x, y })
  }
  get leftBottom() {
    const { left: x, bottom: y } = $(this).$
    return $(new Point, { x, y })
  }
  get rightBottom() {
    const { right: x, bottom: y } = $(this).$
    return $(new Point, { x, y })
  }
  lt = alias(this, 'leftTop')
  rt = alias(this, 'rightTop')
  lb = alias(this, 'leftBottom')
  rb = alias(this, 'rightBottom')

  // create lines moving clockwise starting left bottom
  get leftLine() {
    const { leftBottom: p1, leftTop: p2 } = this
    return $(new Line, { p1, p2 })
  }
  get topLine() {
    const { leftTop: p1, rightTop: p2 } = this
    return $(new Line, { p1, p2 })
  }
  get rightLine() {
    const { rightTop: p1, rightBottom: p2 } = this
    return $(new Line, { p1, p2 })
  }
  get bottomLine() {
    const { rightBottom: p1, leftBottom: p2 } = this
    return $(new Line, { p1, p2 })
  }
  ll = alias(this, 'leftLine')
  tl = alias(this, 'topLine')
  rl = alias(this, 'rightLine')
  bl = alias(this, 'bottomLine')

  get hw() { return this.w / 2 }
  get hh() { return this.h / 2 }

  get centerX() { return this.x + this.hw }
  set centerX(x: number) { this.x = x - this.hw }

  get centerY() { return this.y + this.hh }
  set centerY(y: number) { this.y = y - this.hh }

  cx = alias(this, 'centerX')
  cy = alias(this, 'centerY')

  get center() {
    const { cx: x, cy: y } = $(this).$
    return $(new Point, { x, y })
  }
  get centerLeft() {
    const { left: x, cy: y } = $(this).$
    return $(new Point, { x, y })
  }
  get centerTop() {
    const { cx: x, top: y } = $(this).$
    return $(new Point, { x, y })
  }
  get centerRight() {
    const { right: x, cy: y } = $(this).$
    return $(new Point, { x, y })
  }
  get centerBottom() {
    const { cx: x, bottom: y } = $(this).$
    return $(new Point, { x, y })
  }

  cl = alias(this, 'centerLeft')
  ct = alias(this, 'centerTop')
  cr = alias(this, 'centerRight')
  cb = alias(this, 'centerBottom')

  safe() {
    // TODO: bench which is faster, this or single .finite()
    $.fx(() => {
      const { x } = this
      this.x = !isFinite(x) ? 0 : x
    })
    $.fx(() => {
      const { y } = this
      this.y = !isFinite(y) ? 0 : y
    })
    $.fx(() => {
      const { w } = this
      this.w = !isFinite(w) ? 0 : w
    })
    $.fx(() => {
      const { h } = this
      this.h = !isFinite(h) ? 0 : h
    })
    return this
  }
  zero() {
    return this.set(0)
  }
  get whenSized(): this | undefined {
    if (this.w && this.h) return this
  }
  get hasSize() {
    return this.size.hasSize
  }
  @fn finite() {
    const { x, y, w, h } = this
    this.x = !isFinite(x) ? 0 : x
    this.y = !isFinite(y) ? 0 : y
    this.w = !isFinite(w) ? 0 : w
    this.h = !isFinite(h) ? 0 : h
    return this
  }
  @fn set(o: RectLike | number) {
    if (typeof o === 'number') {
      this.x = o
      this.y = o
      this.w = o
      this.h = o
    }
    else {
      this.x = o.x
      this.y = o.y
      this.w = o.w
      this.h = o.h
    }
    return this
  }
  @fn setPos({ x, y }: PointLike) {
    this.x = x
    this.y = y
    return this
  }
  @fn setSize({ w, h }: { w: number, h: number }) {
    this.w = w
    this.h = h
    return this
  }
  copy() {
    const { x, y, w, h } = this
    return $(new Rect, { x, y, w, h })
  }
  @fn scale(factor: number) {
    this.x *= factor
    this.y *= factor
    this.w *= factor
    this.h *= factor
    return this
  }
  @fn translate(o: PointLike | number) {
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
  @fn translateNegative(o: PointLike | number) {
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
  @fn scaleSizeLinear(n: number) {
    this.w += n
    this.h += n
    return this
  }
  @fn scaleSize(factor: number) {
    this.w *= factor
    this.h *= factor
    return this
  }
  @fn scaleWidth(factor: number) {
    this.w *= factor
    return this
  }
  @fn scaleHeight(factor: number) {
    this.h *= factor
    return this
  }
  @fn floor() {
    const { x, y, w, h } = this
    this.x = Math.floor(x)
    this.y = Math.floor(y)
    this.w = Math.floor(w)
    this.h = Math.floor(h)
    return this
  }
  @fn ceil() {
    const { x, y, w, h } = this
    this.x = Math.ceil(x)
    this.y = Math.ceil(y)
    this.w = Math.ceil(w)
    this.h = Math.ceil(h)
    return this
  }
  @fn round() {
    const { x, y, w, h } = this
    this.x = Math.round(x)
    this.y = Math.round(y)
    this.w = Math.round(w)
    this.h = Math.round(h)
    return this
  }
  @fn floorCeil() {
    const { x, y, w, h } = this
    this.x = Math.floor(x)
    this.y = Math.floor(y)
    this.w = Math.ceil(w)
    this.h = Math.ceil(h)
    return this
  }
  clear(c: CanvasRenderingContext2D) {
    const { x, y, w, h } = this
    c.clearRect(x, y, w, h)
    return this
  }
  stroke(
    c: CanvasRenderingContext2D,
    color: string = this.strokeColor) {
    const { x, y, w, h } = this
    c.strokeStyle = color
    c.strokeRect(x, y, w, h)
    return this
  }
  fill(
    c: CanvasRenderingContext2D,
    color: string = this.fillColor) {
    const { x, y, w, h } = this
    c.fillStyle = color
    c.fillRect(x, y, w, h)
    return this
  }
  drawImage(
    canvas: HTMLCanvasElement,
    c: CanvasRenderingContext2D,
    pr = 1,
    normalize = false) {
    const { x, y, w, h } = this
    let n = !normalize ? 1 : 0
    c.drawImage(
      canvas,
      x * pr * n,
      y * pr * n,
      w * pr,
      h * pr,
      x,
      y,
      w,
      h
    )
    return this
  }
  drawImageNormalizePos(
    canvas: HTMLCanvasElement,
    c: CanvasRenderingContext2D,
    pr: number,
    pos: PointLike) {
    const { x, y, w, h } = this
    c.drawImage(
      canvas,
      (x - pos.x) * pr,
      (y - pos.y) * pr,
      w * pr,
      h * pr,
      x,
      y,
      w,
      h
    )
    return this
  }
  @fn resizeToWindow() {
    this.w = window.innerWidth
    this.h = window.innerHeight
    return this
  }
  isPointWithin(o: PointLike) {
    const { x, y, r, b } = this
    return (
      o.x >= x && o.x <= r &&
      o.y >= y && o.y <= b
    )
  }
  @fn transformMatrix(m: MatrixLike) {
    const { a, b, c, d, e, f } = m
    const { x, y, w, h } = this
    this.x = a * x + c * y + e
    this.y = b * x + d * y + f
    this.w = a * w + c * h
    this.h = b * w + d * h
    return this
  }
  @fn transformMatrixScaled(
    m: MatrixLike,
    pr = 1) {
    if (pr === 1) return this.transformMatrix(m)
    else return this.scale(pr).transformMatrix(m).scale(1 / pr)
  }
  @fn combine(o: RectLike) {
    if (!this.hasSize) {
      return this.set(o)
    }

    let { left, top, right, bottom } = this

    const o_left = o.x
    const o_top = o.y
    const o_right = o.x + o.w
    const o_bottom = o.y + o.h

    if (o_left < left) left = o_left
    if (o_top < top) top = o_top
    if (o_right > right) right = o_right
    if (o_bottom > bottom) bottom = o_bottom

    this.x = left
    this.y = top
    this.w = right - left
    this.h = bottom - top

    return this
  }
  @fn combineRects(rects: RectLike[], count?: number) {
    let i = 0
    for (const r of rects) {
      this.combine(r)
      if (++i === count) break
    }
    return this
  }
  @fn intersectionRect(r2: Rect) {
    const r1 = this

    if (r1.right < r2.left || r1.left > r2.right) return

    const x1 = Math.max(r1.left, r2.left)
    const y1 = Math.max(r1.top, r2.top)
    const x2 = Math.min(r1.right, r2.right)
    const y2 = Math.min(r1.bottom, r2.bottom)

    if (x1 < x2 && y1 < y2) {
      temp.x = x1
      temp.y = y1
      temp.w = x2 - x1
      temp.h = y2 - y1
      return temp
    }
  }
  @fn zoomLinear(n: number) {
    const t = -n / 2
    return this.scaleSizeLinear(n).translate({ x: t, y: t })
  }
  @fn contain(o: Rect) {
    const { l, t, r, b } = this
    if (t < o.t) this.t = o.t
    else if (b > o.b) this.b = o.b

    if (r > o.r) this.r = o.r
    else if (l < o.l) this.l = o.l

    return this
  }
}

const temp = $(new Rect)

export function byPosX(a: { pos: Point }, b: { pos: Point }) {
  return a.pos.x - b.pos.x
}

export function byPosY(a: { pos: Point }, b: { pos: Point }) {
  return a.pos.y - b.pos.y
}
