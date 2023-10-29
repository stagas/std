// log.active
import { $, fn, fx, of } from 'signal'
import { PointerLikeEvent, dom, on } from 'utils'
import { Anim, AnimState } from './anim.ts'
import { Point } from './point.ts'
import { World } from './world.ts'

export enum PointerEventType {
  Wheel,
  Move,
  Down,
  Up,
  Leave,
  Menu,
}

const PointerEventTypeMap: Record<string, PointerEventType> = {
  wheel: PointerEventType.Wheel,
  mousedown: PointerEventType.Down,
  pointercancel: PointerEventType.Leave,
  contextmenu: PointerEventType.Menu,
  mouseup: PointerEventType.Up,
  mousemove: PointerEventType.Move,
  pointermove: PointerEventType.Move,
  mouseleave: PointerEventType.Leave,
}

export class Pointer {
  constructor(public world: World) { }

  @fx init_listeners() {
    const { world, handler: h } = $.of(this)
    const { canvas: { el } } = $.of(world)
    return [
      on(el, 'wheel', h, { passive: true }),
      on(el, 'mousedown', h),
      on(el, 'pointercancel', h),
      on(el, 'contextmenu', h),
      on(window, 'mouseup', h),
      on(window, 'mousemove', h),
      on(window, 'pointermove', h),
      on(document, 'mouseleave', h),
    ]
  }

  /** The latest real DOM event object received from any listener. */
  real?: PointerLikeEvent

  /** Normalized DOM-compatible pointer event. */
  event = $({
    type: 'pointermove',
    pageX: 0,
    pageY: 0,
    deltaX: 0,
    deltaY: 0,
    button: 0,
    buttons: 0,
    altKey: void 0 as true | undefined,
    ctrlKey: void 0 as true | undefined,
    shiftKey: void 0 as true | undefined,
    timeStamp: -999999,
  })

  get type(): PointerEventType {
    return of(PointerEventTypeMap)[this.event.type]
  }

  time = this.event.$.timeStamp

  pos = $(new Point, {
    x: this.event.$.pageX,
    y: this.event.$.pageY
  })

  wheel = $(new Point, {
    x: this.event.$.deltaX,
    y: this.event.$.deltaY
  })

  button = this.event.$.button
  buttons = this.event.$.buttons

  alt = this.event.$.altKey
  ctrl = this.event.$.ctrlKey
  shift = this.event.$.shiftKey

  @fn handler = (real: PointerLikeEvent) => {
    dom.stop(real)

    if (this.world.anim.state & AnimState.Animating) {
      if (real.type === 'mousemove') return
    }
    else {
      if (real.type === 'pointermove') return
    }

    this.real = real

    const { event } = this

    event.type = real.type
    event.pageX = Math.round(real.pageX)
    event.pageY = Math.round(real.pageY)
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
        event.button = real.button
        event.buttons = real.buttons
        break
    }
  }
}
