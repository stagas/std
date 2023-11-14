// log.active
import { $, fx, nu, of, when, whenNot } from 'signal'
import { MouseButton } from 'utils'
import { DOUBLE_CLICK_MS, SINGLE_CLICK_MS } from './constants.ts'
import { Mouseable } from './mouseable.ts'
import { Point } from './point.ts'
import { PointerEventType } from './pointer.ts'
import { Scene } from './scene.ts'

export class Mouse extends Scene {
  constructor(public it: Mouseable.It) { super(it.ctx) }

  get pointer() { return this.ctx.world.pointer }

  origin = $(new Point)

  downCount = 0
  downTime = 0
  downPos = $(new Point)

  hoverIt?: Mouseable.It | null
  focusIt?: Mouseable.It | null | undefined
  downIt?: Mouseable.It | null | undefined

  @fx prevent_downIt_invisible() {
    const { downIt } = when(this)
    $()
    return fx(() => {
      const { isVisible } = whenNot(downIt.renderable)
      downIt.renderable.isVisible = true
    })
  }
  @fx update_it_mouseable_isDown() {
    const { downIt: { mouseable: m } } = when(this)
    $()
    m.isDown = true
    m.mouse.downPos.set(m.mouse.pos)
    return () => {
      m.isDown = false
    }
  }
  @fx update_it_mouseable_focusIt() {
    const { downIt: { mouseable: m } } = when(this)
    $()
    if (m.canFocus) {
      this.focusIt = this.downIt
    }
  }
  @fx update_it_mouseable_isFocused() {
    const { focusIt: { mouseable: m } } = when(this)
    $()
    m.isFocused = true
    m.onMouseEvent?.(Focus)
    return () => {
      m.isFocused = false
      m.onMouseEvent?.(Blur)
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
  *traverseGetItAtPoint(it: Mouseable.It, downIt?: Mouseable.It | null | undefined): Generator<Mouseable.It> {
    const { renderable: r, mouseable: m } = it
    const { pointer: { pos }, origin } = of(this)

    origin.add(r.layout)

    // First find the downIt and its scroll, if given,
    // and yield that before everything else.
    if (it === downIt) {
      m.mouse.pos.set(pos).sub(origin)
      yield downIt
      yield* this.getItsUnderPointer(this.it)
      return
    }

    if (r.scroll) origin.add(r.scroll)

    if (m.its) for (const curr of m.its) {
      if (!curr.mouseable.it.renderable.isVisible) {
        continue
      }
      yield* this.traverseGetItAtPoint(curr, downIt)
    }

    if (r.scroll) origin.sub(r.scroll)

    let item: Mouseable.It | false | undefined
    if (item = m.getItAtPoint(
      m.mouse.pos.set(pos).sub(origin)
    )) {
      if (!downIt) yield item
    }

    origin.sub(r.layout)
  }
  *getItsUnderPointer(it: Mouseable.It, downIt?: Mouseable.It | null | undefined) {
    const { origin } = of(this)
    origin.zero()
    yield* this.traverseGetItAtPoint(it, downIt)
  }
  @fx handle_pointer_event() {
    const { it, ctx, pointer } = of(this)
    const { time, real } = of(pointer)
    $()
    const { type } = pointer
    const { downIt } = this

    const kind = PointerEventMap[type]

    log(Mouse.EventKind[kind], pointer.pos.text)

    log('downIt', downIt, downIt?.renderable.isVisible)

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
        if (!downIt) {
          this.hoverIt = null
        }
        return
    }

    let i = 0

    const its = this.getItsUnderPointer(it, this.downIt)

    for (const it of its) {
      const { mouseable: m } = it

      log('It', it, m.canHover)

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
            if (pointer.button === MouseButton.Left) {
              this.downIt = it
            }
            break
        }
        handled = true
      }

      switch (kind) {
        case Up:
          if (time - this.downTime < SINGLE_CLICK_MS && it === downIt) {
            if (pointer.button === MouseButton.Left) {
              m.onMouseEvent?.(Click)
              handled = true
            }
          }
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
