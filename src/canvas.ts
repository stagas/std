import { $, fx } from 'signal'
import { assign, dom } from 'utils'
import { Point } from './point'
import { World } from './world'

export class Canvas {
  world = World.Current
  size = $($(new Point, { pr: this.world.screen.$.pr! }).resizeToWindow())
  width = this.size.$.w
  height = this.size.$.h
  left = 0
  right = this.size.$.w
  bottom = this.size.$.h
  fullWindow?: boolean

  el = dom.el<HTMLCanvasElement>('canvas', {
    style: {
      cssText: /*css*/`
      touch-action: none;
      user-select: none;
      `
    }
  })
  get c() {
    return this.el.getContext('2d')!
  }

  @fx autoResizeToFitWindow() {
    const { fullWindow, size: { pr }, world: { screen: { viewport: { x, y } } } } = $.of(this)
    if (fullWindow) this.size.resizeToWindow()
  }

  style?: CSSStyleDeclaration
  @fx init() {
    const { size, el, c } = this
    const { ifNotZero, pr, prScaled: { wh } } = $.of(size)

    assign(el, wh)
    c.scale(pr, pr)

    const { style } = $.of<Canvas>(this)
    assign(style, size.whPx)
  }

  appendTo(el: HTMLElement) {
    el.append(this.el)
    this.style = this.el.style
    return this
  }

  clear() {
    this.size.clear(this.c)
    return this
  }
  fill(color?: string) {
    this.size.fill(this.c, color)
    return this
  }
}

export function test_Canvas() {
  // @env browser
  describe('Canvas', () => {
    it('works', () => {
      const canvas = $(new Canvas)
      canvas.size.set({ x: 100, y: 100 })
      canvas.appendTo(dom.body)
      fx(() => {
        const { pr } = canvas.size
        canvas.fill()
      })
    })
  })
}
