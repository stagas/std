import { $ } from 'signal'
import { Rect } from './rect.ts'
import { FixedArray } from './fixed-array.ts'
import { poolArrayGet } from 'utils'

const rectPool = $(new FixedArray<Rect>)
function getRect() {
  return poolArrayGet(rectPool.array, rectPool.count++, Rect.create)
}

const splitRects = $(new FixedArray<Rect>)
const nonOverlappingRects = $(new FixedArray<Rect>)
const tempRects1 = $(new FixedArray<Rect>)
const tempRects2 = $(new FixedArray<Rect>)

function splitRectByRect(r1: Rect, r2: Rect): $<FixedArray<Rect>> {
  const result = splitRects
  result.count = 0

  if (!r1.intersectsRect(r2)) {
    result.push(r1)
  }
  else {
    if (r2.left > r1.left) {
      result.push(
        getRect().setParameters(r1.left, r1.top, r2.left - r1.left, r1.h))
    }
    if (r2.right < r1.right) {
      result.push(
        getRect().setParameters(r2.right, r1.top, r1.right - r2.right, r1.h))
    }
    if (r2.top > r1.top) {
      result.push(
        getRect().setParameters(
          Math.max(r1.left, r2.left),
          r1.top,
          Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left),
          r2.top - r1.top))
    }
    if (r2.bottom < r1.bottom) {
      result.push(
        getRect().setParameters(
          Math.max(r1.left, r2.left),
          r2.bottom,
          Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left),
          r1.bottom - r2.bottom))
    }
  }

  return result
}

export function mergeRects(rects: Rect[], count: number): $<FixedArray<Rect>> {
  rectPool.count = 0
  nonOverlappingRects.count = 0

  for (let i = 0, rect: Rect; i < count; i++) {
    rect = rects[i]

    let newRects = tempRects1
    newRects.count = 0
    newRects.push(rect)

    for (let j = 0, existingRect: Rect, nextRects: $<FixedArray<Rect>> = tempRects2; j < nonOverlappingRects.count; j++) {
      existingRect = nonOverlappingRects.array[j]

      nextRects.count = 0

      for (let k = 0, newR: Rect, splits: FixedArray<Rect>; k < newRects.count; k++) {
        newR = newRects.array[k]

        splits = splitRectByRect(newR, existingRect)

        for (let m = 0; m < splits.count; m++) {
          nextRects.push(splits.array[m])
        }
      }

      ;[newRects, nextRects] = [nextRects, newRects]
    }

    for (let j = 0; j < newRects.count; j++) {
      nonOverlappingRects.push(newRects.array[j])
    }
  }

  return nonOverlappingRects
}

export async function test_clip() {
  // @env browser
  const { randomHex } = await import('utils')

  describe('clip', () => {
    let c: CanvasRenderingContext2D
    beforeAll(() => {
      const canvas = document.createElement('canvas')
      canvas.width = 280
      canvas.height = 480
      document.body.append(canvas)
      c = canvas.getContext('2d')!
    })
    it('works', () => {
      const a = $(new Rect, { x: 10, y: 10, w: 30, h: 30 })
      const b = $(new Rect, { x: 20, y: 20, w: 30, h: 30 })
      const b1 = $(new Rect, { x: 30, y: 30, w: 30, h: 30 })
      const res = mergeRects([a, b, b1], 3)

      console.log(res.array)
      // for (let i = 0; i < res.length; i++) {
      //   if (i > 100) break
      //   const a = res[i]
      //   const b = res[i + 1]
      //   res.push(...clip(a, b))
      //   res.sort((a, b) => a.y - b.y)
      //   // console.log(res)
      // }
      // // let res = [...clip(a, b), ...clip(b, a)]
      for (let i = 0; i < res.count; i++) {
        const r = res.array[i]
        const hex = '#' + randomHex()
        r.stroke(c, hex + 'a')
        r.fill(c, hex + '6')
        c.textBaseline = 'middle'
        c.textAlign = 'center'
        c.fillStyle = '#fff'
        c.fillText(`${i}`, r.center.x, r.center.y)
      }
    })
  })
}
