import { $, fn, fx } from 'signal'
import { PointerLikeEvent, dom, on } from 'utils'
import { Point } from '../src/point.ts'
import { World } from './world.ts'
import { Canvas } from './canvas.ts'

type PointerEventType =
  | 'wheel'
  | 'pointermove'
  | 'pointerdown'
  | 'pointerup'
  | 'pointerleave'

const remap = {
  mousemove: 'pointermove',
  mousedown: 'pointerdown',
  mouseup: 'pointerup',
  pointercancel: 'pointerleave',
}

export class Pointer {
  constructor(public canvas: Canvas) { }

  world = World.Current

  /** The latest real DOM event object received from any listener. */
  real?: PointerLikeEvent

  /** Normalized DOM-like pointer event. */
  event = $({
    type: 'pointermove' as PointerEventType,
    pageX: 0,
    pageY: 0,
    deltaX: 0,
    deltaY: 0,
    buttons: 0,
    altKey: void 0 as true | undefined,
    ctrlKey: void 0 as true | undefined,
    shiftKey: void 0 as true | undefined,
    timeStamp: 0,
  })

  pos = $(new Point, {
    x: this.event.$.pageX,
    y: this.event.$.pageY
  })

  alt = this.event.$.altKey
  ctrl = this.event.$.ctrlKey
  shift = this.event.$.shiftKey

  @fx init() {
    const { canvas: { el }, handler } = this
    const h = handler.bind(this)
    return [
      on(el, 'wheel', h, { passive: true }),
      on(el, 'mousedown', h),
      on(el, 'pointercancel', h),
      on(window, 'mouseup', h),
      on(window, 'mousemove', h),
      on(window, 'pointermove', h),
      on(document, 'mouseleave', h),
    ]
  }

  @fn handler(real: PointerLikeEvent) {
    dom.stop(real)

    if (this.world.isAnimating) {
      if (real.type === 'mousemove') return
    }

    this.real = real

    const { event } = this

    event.type = remap[real.type]
    event.pageX = real.pageX
    event.pageY = real.pageY
    event.altKey = real.altKey || void 0
    event.ctrlKey = (real.ctrlKey || real.metaKey) || void 0
    event.shiftKey = real.shiftKey || void 0
    event.timeStamp = real.timeStamp || performance.now()

    switch (real.type) {
      case 'wheel':
        event.deltaX = real.deltaX
        event.deltaY = real.deltaY
        break

      case 'mousemove':
      case 'mousedown':
      case 'mouseup':
      case 'mouseleave':

      case 'pointermove':
      case 'pointerdown':
      case 'pointerup':
      case 'pointerleave':
      case 'pointercancel':
        event.buttons = real.buttons
        break
    }
  }
}
