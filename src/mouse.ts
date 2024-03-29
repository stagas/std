// log.active
import { $, fx, of, when } from 'signal'
import { MouseButton } from 'utils'
import { DOUBLE_CLICK_MS, SINGLE_CLICK_MS } from './constants.ts'
import { Mouseable } from './mouseable.ts'
import { Point } from './point.ts'
import { PointerEventType } from './pointer.ts'
import { Rect } from './rect.ts'
import { Scene } from './scene.ts'
import { TraverseOp } from './traverse.ts'

const mousePos = $(new Point)

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

  clipArea = $(new Rect)

  // @fx prevent_downIt_invisible() {
  //   const { downIt } = when(this)
  //   $()
  //   return fx(() => {
  //     const { isVisible } = whenNot(downIt.renderable)
  //     downIt.renderable.isVisible = true
  //   })
  // }
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
    const { hoverIt } = when(this)
    const { mouseable: m } = hoverIt
    if (this.downIt && hoverIt !== this.downIt) return
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
  // *traverseGetItAtPoint(it: Mouseable.It, downIt?: Mouseable.It | null | undefined): Generator<Mouseable.It> {
  //   const { renderable: r, mouseable: m } = it
  //   const { pointer: { pos }, origin, clipArea, ctx: { world: { screen: { rect } } } } = of(this)

  //   origin.add(r.layout)

  //   // First find the downIt and its scroll, if given,
  //   // and yield that before everything else.
  //   if (it === downIt) {
  //     m.mouse.pos.set(pos).sub(origin)
  //     yield downIt
  //     yield* this.getItsUnderPointer(this.it)
  //     return
  //   }

  //   if (r.scroll) origin.add(r.scroll)

  //   if (m.its) for (const curr of m.its) {
  //     if (!curr.mouseable.it.renderable.isVisible) {
  //       continue
  //     }
  //     // if (curr.renderable.clipContents) {
  //     //   clipArea.setSize(curr.renderable.view.size)
  //     // }
  //     yield* this.traverseGetItAtPoint(curr, downIt)
  //     if (curr.renderable.clipContents) {
  //       clipArea.zero()
  //     }
  //   }

  //   if (r.scroll) origin.sub(r.scroll)

  //   origin.sub(r.layout)

  //   let item: Mouseable.It | false | undefined
  //   const mousePos = m.mouse.pos.set(pos).sub(origin)
  //   if (item = (
  //     clipArea.hasSize
  //       ? clipArea.isPointWithin(mousePos)
  //       && m.getItAtPoint(mousePos)
  //       : m.getItAtPoint(mousePos)
  //   )) {
  //     if (!downIt) yield item
  //   }
  // }
  // *getItsUnderPointer(it: Mouseable.It, downIt?: Mouseable.It | null | undefined) {
  //   const { origin, clipArea, ctx: { world: { screen: { rect } } } } = of(this)
  //   origin.zero()
  //   clipArea.zero()
  //   yield* this.traverseGetItAtPoint(it, downIt)
  // }
  @fx handle_pointer_event() {
    const { it, pointer } = of(this)
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
              // this.hoverIt
              //   =
              this.downIt
                = null
              break
          }
        }
        break

      case Leave:
        // if (!downIt) {
          this.hoverIt = null
        // }
        return
    }

    let i = 0
    const { pointer: { pos }, origin, clipArea } = of(this)
    origin.zero()
    clipArea.zero()
    mousePos.set(pos)

    if (this.downIt) {
      for (const [op, mit] of it.mouseable.visibleIts) {
        if (op === TraverseOp.Item) {
          if (downIt === mit) {
            const { mouseable: m } = mit
            m.mouse.pos.set(mousePos)
            if (m.onMouseEvent?.(kind)) {
              return
            }
            break
          }
        }
        else {
          const { renderable: r } = mit
          if (op === TraverseOp.Enter) {
            if (r.scroll) origin.add(r.scroll)
            if (r.layout) origin.add(r.layout)
            mousePos.set(pos).sub(origin)
          }
          else if (op === TraverseOp.Leave) {
            if (r.scroll) origin.sub(r.scroll)
            if (r.layout) origin.sub(r.layout)
            mousePos.set(pos).sub(origin)
          }
        }
      }
      origin.zero()
      clipArea.zero()
      mousePos.set(pos)
    }

    for (const [op, mit] of it.mouseable.visibleIts) {
      if (op === TraverseOp.Item) {
        const { mouseable: m } = mit

        const it =
          // clipArea.hasSize
          //   ? clipArea.isPointWithin(mousePos)
          //   && m.getItAtPoint(mousePos)
          //   :
          m.getItAtPoint(mousePos)

        if (!it) continue

        m.mouse.pos.set(mousePos)

        log('It', it, m.canHover)

        if (m.canHover) {
          if (!i++ && this.hoverIt !== it) {
            this.hoverIt = it
          }
        }

        if (this.downIt) continue

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
      else {
        const { renderable: r } = mit
        if (op === TraverseOp.Enter) {
          if (r.scroll) origin.add(r.scroll)
          if (r.layout) origin.add(r.layout)
          mousePos.set(pos).sub(origin)
        }
        else if (op === TraverseOp.Leave) {
          if (r.scroll) origin.sub(r.scroll)
          if (r.layout) origin.sub(r.layout)
          mousePos.set(pos).sub(origin)
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
