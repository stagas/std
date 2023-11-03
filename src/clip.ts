import { $ } from 'signal'
import { Rect } from './rect.ts'

// function getClipped(A, B) {
//   var rectangles = [];
//   if (A.top < B.top) {
//       rectangles.push({ left: A.left, top: A.top, right: A.right, bottom: B.top });
//   }
//   if (A.left < B.left) {
//       rectangles.push({ left: A.left, top: max(A.top, B.top), right: B.left, bottom: min(A.bottom, B.bottom) });
//   }
//   if (A.right > B.right) {
//       rectangles.push({ left: B.right, top: max(A.top, B.top), right: A.right, bottom: min(A.bottom, B.bottom) });
//   }
//   if (A.bottom > B.bottom) {
//        rectangles.push({ left: A.left, top: B.bottom, right: A.right, bottom. A.bottom });
//   }

//   return rectangles;
// }
function clip(a: $<Rect>, b: $<Rect>): $<Rect>[] {
  const res: $<Rect>[] = []

  if (a.intersectsRect(b, 0)) {
    // console.log('YES', a.text, b.text)
    if (a.top < b.top) {
      res.push($(new Rect, {
        x: a.x,
        y: a.y,
        w: a.w,
        h: b.top - a.top
      }))
    }
    if (a.left < b.left) {
      let y = Math.max(a.top, b.top)
      res.push($(new Rect, {
        x: a.x,
        y,
        w: b.right - a.x,
        h: Math.min(a.bottom, b.bottom) - y
      }))
    }
    if (a.right > b.right) {
      let y = Math.max(a.top, b.top)
      res.push($(new Rect, {
        x: b.right,
        y,
        w: a.right - b.right,
        h: Math.min(a.bottom, b.bottom) - y
      }))
    }
    if (a.bottom > b.bottom) {
      res.push($(new Rect, {
        x: a.left,
        y: b.bottom,
        w: a.w,
        h: a.bottom - b.bottom
      }))
    }
  }
  else {
    console.log('NO')
  }
  // const extra: Rect[] = []
  // for (const r of res) {
  //   extra.push(...clip(r, b))
  // }
  // res.push(...extra)

  return res
}


function splitRect(rect1: Rect, rect2: Rect): Rect[] {
  const result: Rect[] = [];

  // Check if rect1 is completely contained within rect2
  if (
    rect1.x >= rect2.x &&
    rect1.y >= rect2.y &&
    rect1.x + rect1.w <= rect2.x + rect2.w &&
    rect1.y + rect1.h <= rect2.y + rect2.h
  ) {
    return result;
  }

  // Split rect1 into smaller rectangles if they overlap
  if (rect1.x < rect2.x + rect2.w && rect1.x + rect1.w > rect2.x) {
    if (rect1.y < rect2.y + rect2.h && rect1.y + rect1.h > rect2.y) {
      // Calculate the overlapping area
      const x1 = Math.max(rect1.x, rect2.x);
      const y1 = Math.max(rect1.y, rect2.y);
      const x2 = Math.min(rect1.x + rect1.w, rect2.x + rect2.w);
      const y2 = Math.min(rect1.y + rect1.h, rect2.y + rect2.h);
      const overlapW = x2 - x1;
      const overlapH = y2 - y1;

      // Add the non-overlapping parts of rect1 as separate rectangles
      if (rect1.x < x1) {
        result.push(
          $(new Rect,
          { x: rect1.x, y: rect1.y, w: x1 - rect1.x, h: rect1.h }));
      }
      if (rect1.x + rect1.w > x2) {
        result.push(
          $(new Rect,
          { x: x2, y: rect1.y, w: (rect1.x + rect1.w) - x2, h: rect1.h }));
      }
      if (rect1.y < y1) {

        result.push(
          $(new Rect,{ x: x1, y: rect1.y, w: overlapW, h: y1 - rect1.y }));
      }
      if (rect1.y + rect1.h > y2) {
        result.push($(new Rect,{ x: x1, y: y2, w: overlapW, h: (rect1.y + rect1.h) - y2 }));
      }
    }
  }

  if (result.length === 0) {
    result.push(rect1);
  }

  return result;
}

export function mergeRects(rects: Rect[]): Rect[] {
  // Helper function to check if two rectangles overlap
  function doRectsOverlap(rect1: Rect, rect2: Rect): boolean {
    return (
      rect1.x < rect2.x + rect2.w &&
      rect1.x + rect1.w > rect2.x &&
      rect1.y < rect2.y + rect2.h &&
      rect1.y + rect1.h > rect2.y
    );
  }

  // Helper function to split a rectangle by another
  function splitRectByRect(baseRect: Rect, cuttingRect: Rect): Rect[] {
    const result: Rect[] = [];

    if (!doRectsOverlap(baseRect, cuttingRect)) {
      // No overlap, return the baseRect as-is
      result.push(baseRect);
    } else {
      // Determine the left, right, top, and bottom split points
      const left = baseRect.x;
      const right = baseRect.x + baseRect.w;
      const top = baseRect.y;
      const bottom = baseRect.y + baseRect.h;

      // Split the baseRect into up to four smaller rectangles
      if (cuttingRect.x > left) {
        result.push($(new Rect,{ x: left, y: top, w: cuttingRect.x - left, h: baseRect.h }));
      }
      if (cuttingRect.x + cuttingRect.w < right) {
        result.push($(new Rect,{ x: cuttingRect.x + cuttingRect.w, y: top, w: right - (cuttingRect.x + cuttingRect.w), h: baseRect.h }));
      }
      if (cuttingRect.y > top) {
        result.push($(new Rect,{ x: Math.max(left, cuttingRect.x), y: top, w: Math.min(right, cuttingRect.x + cuttingRect.w) - Math.max(left, cuttingRect.x), h: cuttingRect.y - top }));
      }
      if (cuttingRect.y + cuttingRect.h < bottom) {
        result.push($(new Rect,{ x: Math.max(left, cuttingRect.x), y: cuttingRect.y + cuttingRect.h, w: Math.min(right, cuttingRect.x + cuttingRect.w) - Math.max(left, cuttingRect.x), h: bottom - (cuttingRect.y + cuttingRect.h) }));
      }
    }

    return result;
  }

  const nonOverlappingRects: Rect[] = [];

  for (const rect of rects) {
    let newRects: Rect[] = [rect];

    for (const existingRect of nonOverlappingRects) {
      const nextRects: Rect[] = [];

      for (const newR of newRects) {
        nextRects.push(...splitRectByRect(newR, existingRect));
      }

      newRects = nextRects;
    }

    nonOverlappingRects.push(...newRects);
  }

  return nonOverlappingRects;
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
      const res = mergeRects([a, b, b1])

console.log(res)
      // for (let i = 0; i < res.length; i++) {
      //   if (i > 100) break
      //   const a = res[i]
      //   const b = res[i + 1]
      //   res.push(...clip(a, b))
      //   res.sort((a, b) => a.y - b.y)
      //   // console.log(res)
      // }
      // // let res = [...clip(a, b), ...clip(b, a)]
      res.forEach((r, i) => {
        const hex = '#' + randomHex()
        r.stroke(c, hex + 'a')
        r.fill(c, hex + '6')
        c.textBaseline = 'middle'
        c.textAlign = 'center'
        c.fillStyle = '#fff'
        c.fillText(`${i}`, r.center.x, r.center.y)
      })
    })
  })
}
