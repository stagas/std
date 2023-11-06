// log.active
import { $, fx, of, when } from 'signal'
import { assign, dom } from 'utils'
import { Point } from './point.ts'
import { World } from './world.ts'
import { Rect } from './rect.ts'

const p = $(new Point)

export class Canvas {
  constructor(
    public world: World,
    public rect = $(new Rect)
  ) { }

  fullWindow?: boolean
  alpha = true

  style?: CSSStyleDeclaration

  el = dom.el<HTMLCanvasElement>('canvas', {
    style: {
      cssText: /*css*/`
      touch-action: none;
      user-select: none;
      `
    }
  })

  get c() {
    return this.el.getContext('2d', { alpha: this.alpha })!
  }

  @fx resize_to_window() {
    const { fullWindow, world: { screen: { viewport: { x, y } } } } = of(this)
    if (fullWindow) this.rect.size.resizeToWindow()
  }

  @fx assign_size(this: Canvas) {
    const { rect: { size }, el, c } = this
    const { w, h } = when(size)
    const { pr } = of(this.world.screen)

    $.untrack(() => {
      assign(el, p.set(size).mul(pr).widthHeight)
      c.scale(pr, pr)
    })

    const { style } = of(this)
    $.untrack(() => {
      assign(style, p.set(size).widthHeightPx)
    })

    this.fill()
  }

  appendTo(el: HTMLElement) {
    el.append(this.el)
    this.style = this.el.style
    return this
  }

  clear() {
    this.rect.size.clear(this.c)
    return this
  }

  fill() {
    this.rect.size.fill(this.c)
  }
}

export function test_canvas() {
  // @env browser
  describe('Canvas', () => {
    it('works', () => {
      const world = $(new World)
      const canvas = $(new Canvas(world))
      canvas.rect.size.set({ x: 100, y: 100 })
      canvas.appendTo(dom.body)
      fx(() => {
        // const { pr } = canvas.size
        canvas.fill()
      })
    })
  })
}
