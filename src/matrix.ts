import { fn, fx } from 'signal'
import { PointLike } from './point'

export interface MatrixLike {
  a: number
  b: number
  c: number
  d: number
  e: number
  f: number
}

export class Matrix {
  m: DOMMatrix = new DOMMatrix()

  a: number = 1
  b: number = 0
  c: number = 0
  d: number = 1
  e: number = 0
  f: number = 0

  @fn sync() {
    const { m } = this
    this.a = m.a
    this.b = m.b
    this.c = m.c
    this.d = m.d
    this.e = m.e
    this.f = m.f
  }
  @fn syncTranslate() {
    const { m } = this
    this.e = m.e
    this.f = m.f
  }

  @fx update_ma() { this.m.a = this.a }
  @fx update_mb() { this.m.b = this.b }
  @fx update_mc() { this.m.c = this.c }
  @fx update_md() { this.m.d = this.d }
  @fx update_me() { this.m.e = this.e }
  @fx update_mf() { this.m.f = this.f }

  @fn scaleDeltaAtPoint(
    delta: number,
    { x, y }: PointLike,
    minScale: number = 0.1): Matrix {
    const { m, a, sync } = this

    const d = (a + (delta * a)) / a

    m.translateSelf(x, y)
      .scaleSelf(d, d)

    m.a
      = m.d
      = Math.max(minScale, m.a)

    m.translateSelf(-x, -y)

    sync()

    return this
  }
  @fn translateFromPoints(
    from: PointLike,
    to: PointLike,
    pr: number = 1): Matrix {
    const { m, a, d, syncTranslate } = this
    m.translateSelf(
      pr * (to.x - from.x) / a,
      pr * (to.y - from.y) / d
    )
    syncTranslate()
    return this
  }
}
