import { alias, fn } from 'signal'
import { RectLike } from './rect.ts'

export interface MatrixLike {
  a: number
  b: number
  c: number
  d: number
  e: number
  f: number
}

export class Matrix {
  a: number = 1
  b: number = 0
  c: number = 0
  d: number = 1
  e: number = 0
  f: number = 0

  sx = alias(this, 'a')
  sy = alias(this, 'd')

  tx = alias(this, 'e')
  ty = alias(this, 'f')

  @fn set(m: MatrixLike) {
    return Matrix.set(this, m)
  }

  @fn translate(x: number, y: number) {
    return Matrix.translate(this, x, y)
  }

  @fn scale(x: number, y: number) {
    return Matrix.scale(this, x, y)
  }

  _valuesGL?: [
    sx: number, cy: number, number,
    cx: number, sy: number, number,
    tx: number, ty: number, number
  ]
  get valuesGL() {
    const { a, b, c, d, e, f } = this
    const o = (this._valuesGL ??= [
      0, 0, 0,
      0, 0, 0,
      0, 0, 1
    ])
    o[0] = a
    o[4] = d
    o[6] = e
    o[7] = f
    return this._valuesGL
  }
  _values?: [
    sx: number, cy: number,
    cx: number, sy: number,
    tx: number, ty: number,
  ]
  get values() {
    const { a, b, c, d, e, f } = this
    const o = (this._values ??= [
      1, 0, 0,
      1, 0, 0,
    ])
    o[0] = a
    o[1] = b
    o[2] = c
    o[3] = d
    o[4] = e
    o[5] = f
    return this._values
  }
}

export namespace Matrix {
  export const set = fn(function set<T extends MatrixLike>(dst: T, src: MatrixLike) {
    dst.a = src.a
    dst.b = src.b
    dst.c = src.c
    dst.d = src.d
    dst.e = src.e
    dst.f = src.f
    return dst
  })

  export const compare = fn(function compare<T extends MatrixLike>(m0: T, m1: MatrixLike, threshold = 0.001) {
    if (
      Math.abs(m0.a - m1.a) < threshold
      && Math.abs(m0.b - m1.b) < threshold
      && Math.abs(m0.c - m1.c) < threshold
      && Math.abs(m0.d - m1.d) < threshold
      && Math.abs(m0.e - m1.e) < threshold
      && Math.abs(m0.f - m1.f) < threshold
    ) {
      return true
    }
    return false
  })

  export const translate = fn(function translate<T extends MatrixLike>(m: T, x: number, y: number) {
    m.e += x * m.a
    m.f += y * m.d
    return m
  })

  export const scale = fn(function scale<T extends MatrixLike>(m: T, x: number, y: number) {
    m.a *= x
    m.d *= y
    return m
  })

  export const viewBox = fn(function viewBox<T extends MatrixLike>(m: T, view: RectLike, box: RectLike) {
    m.a = view.w / box.w
    m.d = view.h / box.h
    m.e = -box.x * m.a
    m.f = -box.y * m.d
    return m
  })
}
