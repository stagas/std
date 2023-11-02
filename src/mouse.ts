// log.active
import { $, fx, nu, of, when } from 'signal'
import { MouseButton } from 'utils'
import { DOUBLE_CLICK_MS, SINGLE_CLICK_MS } from './constants.ts'
import { Mouseable } from './mouseable.ts'
import { Point } from './point.ts'
import { PointerEventType } from './pointer.ts'
import { Scene } from './scene.ts'

export class Mouse extends Scene {
  constructor(public it: Mouseable.It) { super(it.ctx) }

  get pointer() { return this.ctx.world.pointer }

  scroll = $(new Point)

  downCount = 0
  downTime = 0
  downPos = $(new Point)

  hoverIt?: Mouseable.It | null
  focusIt?: Mouseable.It | null | undefined
  downIt?: Mouseable.It | null | undefined

  @fx update_it_mouseable_isDown() {
    const { downIt: { mouseable: m } } = when(this)
    $()
    m.isDown = true
    m.mouse.downPos.set(m.mouse.pos)
    return () => {
      m.isDown = false
    }
  }
  @fx update_it_mouseable_isFocused() {
    const { downIt: { mouseable: m } } = when(this)
    $()
    if (m.canFocus) {
      if (this.focusIt) {
        this.focusIt.mouseable.isFocused = false
        this.focusIt.mouseable.onMouseEvent?.(Blur)
      }
      m.isFocused = true
      m.onMouseEvent?.(Focus)
      this.focusIt = this.downIt
    }
  }
  @fx update_it_mouseable_isHovering() {
    const { hoverIt: { mouseable: m } } = when(this)
    $()
    if (m.canHover) {
      const { ctx: { world } } = of(this)
      m.isHovering = true
      m.onMouseEvent?.(Enter)
      world.screen.cursor = m.cursor
      return () => {
        m.isHovering = false
        m.onMouseEvent?.(Leave)
      }
    }
  }
  *traverseGetItAtPoint(it: Mouseable.It): Generator<Mouseable.It> {
    const { renderable: r, mouseable: m } = it
    const { pointer: { pos }, scroll } = of(this)

    if (r.scroll) scroll.add(r.scroll)

    if (m.its) for (const curr of m.its) {
      if (!curr.mouseable.it.renderable.isVisible) continue
      yield* this.traverseGetItAtPoint(curr)
    }

    if (r.scroll) scroll.sub(r.scroll)

    let item: Mouseable.It | false | undefined
    if (item = m.getItAtPoint(m.mouse.pos.set(pos).sub(scroll))) {
      yield item
    }
  }
  *getItsUnderPointer(it: Mouseable.It) {
    const { pointer: { pos }, scroll } = of(this)
    const { downIt } = this

    scroll.zero()

    // the down It is always the first under the pointer.
    // if (downIt) {
    //   downIt.mouseable.mouse.pos.set(pos)
    //   yield downIt
    // }

    yield* this.traverseGetItAtPoint(it)
  }
  @fx handle_pointer_event() {
    const { it, ctx, pointer } = of(this)
    const { time, real } = of(pointer)
    $()
    const { type } = pointer
    const { downIt } = this

    const kind = PointerEventMap[type]

    log(Mouse.EventKind[kind])

    switch (kind) {
      case Down:
      case Up:
        if (pointer.button === MouseButton.Left) {
          switch (kind) {
            case Down:
              if (time - this.downTime < DOUBLE_CLICK_MS) {
                this.downCount++
              }
              else {
                this.downCount = 1
              }
              this.downTime = time
              break

            case Up:
              this.hoverIt
                = this.downIt
                = null
              break
          }
        }
        break

      case Leave:
        if (downIt) break
        this.hoverIt
          = this.downIt
          = null
        return
    }

    let i = 0
    const its = this.getItsUnderPointer(it)
    for (const it of its) {
      const { mouseable: m } = it

      if (m.canHover) {
        if (!i++ && this.hoverIt !== it) {
          this.hoverIt = it
        }
      }

      // switch (kind) {
      //   case Up:
      //     if (downIt && it !== downIt) {
      //       return
      //     }
      // }

      let handled: boolean | undefined

      if (m.onMouseEvent?.(kind)) {
        switch (kind) {
          case Down:
            this.downIt = it
            break
        }
        handled = true
      }

      switch (kind) {
        case Up:
          if (time - this.downTime < SINGLE_CLICK_MS && it === downIt) {
            m.onMouseEvent?.(Click)
          }
          handled = true
          break
      }

      if (handled) break
    }
  }
}

export namespace Mouse {
  export enum EventKind {
    Wheel,
    Move,
    Down,
    Up,
    Enter,
    Leave,
    Click,
    Menu,
    Focus,
    Blur,
  }
}

const { Wheel, Down, Up, Leave, Move, Menu, Click, Enter, Focus, Blur } = Mouse.EventKind

const PointerEventMap = {
  [PointerEventType.Wheel]: Wheel,
  [PointerEventType.Down]: Down,
  [PointerEventType.Up]: Up,
  [PointerEventType.Leave]: Leave,
  [PointerEventType.Move]: Move,
  [PointerEventType.Menu]: Menu,
} as const
