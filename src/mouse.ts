// log.active
import { $, fx, of } from 'signal'
import { MouseButton } from 'utils'
import { DOUBLE_CLICK_MS, SINGLE_CLICK_MS } from './constants.ts'
import { Mouseable } from './mouseable.ts'
import { Point } from './point.ts'
import { PointerEventType } from './pointer.ts'
import { Scene } from './scene.ts'

export class Mouse extends Scene {
  constructor(public it: Mouseable.It) { super(it.ctx) }

  pos = this.ctx.world.pointer.$.pos
  wheel = this.ctx.world.pointer.$.wheel

  scroll = $(new Point)

  downCount = 0
  downTime = 0
  downPos = $(new Point)

  hoverIt?: Mouseable.It | null
  downIt?: Mouseable.It | null | undefined

  @fx update_it_mouseable_isDown() {
    const { downIt: { mouseable: m } } = of(this)
    $()
    m.isDown = true
    m.mouse.downPos.set(m.mouse.pos)
    return () => {
      m.isDown = false
    }
  }
  @fx update_it_mouseable_isHovering() {
    const { hoverIt: { mouseable: m } } = of(this)
    $()
    const { ctx: { world } } = of(this)
    m.isHovering = true
    m.onMouseEvent?.(Enter)
    world.screen.cursor = m.cursor
    return () => {
      m.isHovering = false
      m.onMouseEvent?.(Leave)
    }
  }
  *traverseGetItAtPoint(it: Mouseable.It): Generator<Mouseable.It> {
    const { renderable: r, mouseable: m, mouseables: ms } = it
    const { pos, scroll } = this

    if (r.scroll) scroll.add(r.scroll)

    if (ms) for (const curr of ms) {
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
    const { pos, downIt, scroll } = this

    scroll.zero()

    // the down It is always the first under the pointer.
    if (downIt) {
      downIt.mouseable.mouse.pos.set(pos)
      yield downIt
    }

    yield* this.traverseGetItAtPoint(it)
  }
  @fx handle_pointer_event() {
    const { it, ctx } = of(this)
    const { world } = of(ctx)
    const { pointer } = of(world)
    const { time, real } = of(pointer)
    $()
    const { type } = pointer
    const { downIt } = this

    const kind = PointerEventMap[type]

    // log(Mouse.EventKind[kind])

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

      if (m.onMouseEvent?.(kind)) {
        switch (kind) {
          case Down:
            this.downIt = it
            break
        }
        return
      }
      else {
        switch (kind) {
          case Up:
            if (time - this.downTime < SINGLE_CLICK_MS && it === downIt) {
              m.onMouseEvent?.(Click)
              return
            }
            break
        }
      }
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
  }
}

const { Wheel, Down, Up, Leave, Move, Menu, Click, Enter } = Mouse.EventKind

const PointerEventMap = {
  [PointerEventType.Wheel]: Wheel,
  [PointerEventType.Down]: Down,
  [PointerEventType.Up]: Up,
  [PointerEventType.Leave]: Leave,
  [PointerEventType.Move]: Move,
  [PointerEventType.Menu]: Menu,
} as const
