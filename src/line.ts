import { $, fn, alias, fx } from 'signal'
import { Rect } from './rect.ts'
import { Point, PointLike } from './point.ts'
import { Shape } from './shape.ts'

export enum Intersect {
  None = 0,
  Left = 1 << 1,
  Top = 1 << 2,
  Right = 1 << 3,
  Bottom = 1 << 4,
  Inside = 1 << 5,
}

export interface LineLike {
  p1: PointLike
  p2: PointLike
}

export class Line extends Shape {
  p1 = $(new Point)
  p2 = $(new Point)
  deltaPoint = $(new Point)
  lerpPoint = $(new Point)

  get json() {
    const { p1, p2 } = this
    return { p1: p1.json, p2: p2.json }
  }

  get _center() { return $(new Point) }
  get center() {
    const { p1, p2, _center: c } = this
    c.x = (p1.x + p2.x) * 0.5
    c.y = (p1.y + p2.y) * 0.5
    return c
  }

  start = alias(this, 'p1')
  end = alias(this, 'p2')

  top = alias(this, 'p1')
  bottom = alias(this, 'p2')

  set(line: LineLike) {
    const { p1, p2 } = this
    p1.set(line.p1)
    p2.set(line.p2)
    return this
  }
  get mag() {
    const { p1, p2 } = this
    return p1.distance(p2)
  }
  get dot() {
    const { p1, p2 } = this
    return (
      p1.x * p2.x +
      p1.y * p2.y
    )
  }
  get angle() {
    const { p1, p2 } = this
    return Math.atan2(
      p2.x - p1.x,
      p2.y - p1.y
    )
  }
  @fn lerp(t: number) {
    const { p1, p2, deltaPoint, lerpPoint } = this
    lerpPoint.set(p2).add(deltaPoint.set(p2).sub(p1).mul(t))
    return lerpPoint
  }

  @fx keepPrevPos() {
    const { x, y } = this.p2
    return () => {
      this.p1.x = x
      this.p1.y = y
    }
  }

  isPointWithin(p: PointLike) {
    const { start, end } = this
    return p.y === start.y
      ? p.x >= start.x && (
        p.y < end.y
        || (p.y === end.y && p.x <= end.x)
      )
      : p.y > start.y && (
        p.y < end.y
        || (p.y === end.y && p.x <= end.x)
      )
  }
  isLineWithin({ p1, p2 }: LineLike) {
    const { start, end } = this
    return p1.y === start.y
      ? p1.x >= start.x && (
        p2.y < end.y
        || (p2.y === end.y && p2.x <= end.x)
      )
      : p1.y > start.y && (
        p2.y < end.y
        || (p2.y === end.y && p2.x <= end.x)
      )
  }
  intersectsLine(other: LineLike) {
    const { p1, p2 } = this

    const a1 = p1
    const a2 = p2

    const b1 = other.p1
    const b2 = other.p2

    let q =
      (a1.y - b1.y) * (b2.x - b1.x) -
      (a1.x - b1.x) * (b2.y - b1.y)

    const d =
      (a2.x - a1.x) * (b2.y - b1.y) -
      (a2.y - a1.y) * (b2.x - b1.x)

    if (d == 0) {
      return false
    }

    var r = q / d

    q = (a1.y - b1.y) * (a2.x - a1.x)
      - (a1.x - b1.x) * (a2.y - a1.y)
    var s = q / d

    if (r < 0 || r > 1 || s < 0 || s > 1) {
      return false
    }

    return true
  }
  // collide line to rectangle and return a new line
  // that is placed just outside of the rectangle and not within
  getLineToRectangleCollisionResponse(
    intersection: Intersect,
    r: Rect) {
    if (intersection === Intersect.None) {
      return this
    }

    const { p1, p2 } = this

    a1.set(p1)
    a2.set(p2)

    var b1 = r.leftTop
    var b2 = r.rightBottom

    if (intersection & Intersect.Left) {
      a1.x = b1.x - 1
    }
    if (intersection & Intersect.Top) {
      a1.y = b1.y - 1
    }
    if (intersection & Intersect.Right) {
      a2.x = b2.x + 1
    }
    if (intersection & Intersect.Bottom) {
      a2.y = b2.y + 1
    }
    if (intersection & Intersect.Inside) {
      p.set(p1).lerp(p2, 0.5)
      p.touchPoint(r)
      a1.x = p.x
      a1.y = p.y
      a2.x = p.x
      a2.y = p.y
    }

    temp.p1 = a1
    temp.p2 = a2
    return temp
  }
  intersectionRect(r: Rect) {
    const { p1, p2 } = this
    const is: Intersect = (this.intersectsLine(r.leftLine) ? Intersect.Left : 0)
      + (this.intersectsLine(r.topLine) ? Intersect.Top : 0)
      + (this.intersectsLine(r.rightLine) ? Intersect.Right : 0)
      + (this.intersectsLine(r.bottomLine) ? Intersect.Bottom : 0)
      + ((p1.withinRect(r) && p2.withinRect(r)) ? Intersect.Inside : 0)
    return is
  }
}

// helpers, used for calculations
const temp = $(new Line)
const a1 = $(new Point)
const a2 = $(new Point)
const p = $(new Point)
