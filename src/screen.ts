import { $, unwrap } from 'signal'
import { on } from 'utils'
import { Point } from './point'

export class Screen {
  viewport = $(new Point)
  pr = unwrap(
    on(window, 'resize', { unsafeInitial: true }),
    () => {
      this.viewport.w = window.innerWidth
      this.viewport.h = window.innerHeight
      return window.devicePixelRatio
    }
  )
}
