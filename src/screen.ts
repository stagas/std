import { $, fx, unwrap } from 'signal'
import { dom, on } from 'utils'
import { Point } from './point.ts'
import { Rect } from './rect.ts'

export class Screen {
  _viewport = $(new Point)
  get viewport() {
    const { _viewport } = this
    $()
    _viewport.w = window.innerWidth
    _viewport.h = window.innerHeight
    return _viewport
  }
  get rect() {
    return $(new Rect(this.viewport))
  }
  pr = unwrap(
    on(window, 'resize', { unsafeInitial: true }),
    () => {
      $()
      this.viewport.w = window.innerWidth
      this.viewport.h = window.innerHeight
      return window.devicePixelRatio
    },
    window.devicePixelRatio
  )
  get prRecip() { return 1 / this.pr }
  cursor = 'default'
  @fx update_style_cursor() {
    const { cursor } = this
    requestAnimationFrame(() => {
      dom.body.style.cursor = cursor
    })
  }
}
