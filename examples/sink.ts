// log.active
import { $, fn, init } from 'signal'
import { dom } from 'utils'
import { Keyboard } from '../src/keyboard.ts'
import { Mouse } from '../src/mouse.ts'
import { Mouseable } from '../src/mouseable.ts'
import { Point } from '../src/point.ts'
import { Pointer } from '../src/pointer.ts'
import { Renderable } from '../src/renderable.ts'
import { Scene } from '../src/scene.ts'
import { World } from '../src/world.ts'
import { BallScene } from './ball-scene.ts'
import { BoxScene } from './box-scene.ts'
import { Box } from './box.ts'

export class Sink extends Scene
  implements Renderable.It, Mouseable.It {
  get balls() {
    $(); return $(new BallScene(this.ctx), { count: 50 })
  }
  get boxes1() {
    $(); return $(new BoxScene(this.ctx), { speed: 0.006 })
  }
  get boxes2() {
    $(); return $(new BoxScene(this.ctx), { speed: 0.012 })
  }
  get renderable() {
    $()
    const it = this
    class BallsRenderable extends Renderable {
      scroll = $(new Point)
      get its() {
        return [
          it.boxes1,
          it.boxes2,
          it.balls,
        ]
      }
      @init init_Balls() {
        this.canvas.fullWindow = true
      }
      @fn init(c: CanvasRenderingContext2D) {
        c.imageSmoothingEnabled = false
        this.need ^= Renderable.Need.Init
      }
    }
    return $(new BallsRenderable(it as Renderable.It))
  }
  get mouseable() {
    $()
    const it = this
    const p = $(new Point)
    class SinkMouseable extends Mouseable {
      get its() {
        return [it.balls]
      }
      onMouseEvent(kind: Mouse.EventKind): true | void | undefined {
        switch (kind) {
          case Mouse.EventKind.Wheel:
            it.renderable.scroll.add(p.set(this.mouse.wheel).mul(0.2)).round()
            return true
        }
      }
    }
    return $(new SinkMouseable(it as Mouseable.It))
  }
}

const pi2 = Math.PI * 2

export function setup() {
  return $.batch(() => {
    const world = $(new World)
    world.pointer = $(new Pointer(world))
    world.keyboard = $(new Keyboard(world))
    world.keyboard.appendTo(dom.body)

    const ctx = { world }

    const sink = $(new Sink(ctx))
    world.render.view = sink.renderable.rect
    world.canvas = sink.renderable.canvas
    world.canvas.appendTo(dom.body)

    world.it = sink

    setTimeout(() => {
      world.keyboard!.textarea.focus()
    }, 50)

    return function start() {
      const { center } = world.screen.viewport

      for (let i = 0; i < 10; i++) {
        sink.boxes1.fixedBoxes.push($(new Box(ctx,
          $(new Point().set(center)
            .angleShiftBy((i / 20) * pi2, 200))
        ), { fixed: true }))
      }
      for (let i = 0; i < 10; i++) {
        sink.boxes1.boxes.push($(new Box(ctx,
          $(new Point().set(center)
            .angleShiftBy((i / 20) * pi2, 200))
        )))
      }
      for (let i = 0; i < 10; i++) {
        sink.boxes2.boxes.push($(new Box(ctx,
          $(new Point().set(center)
            .angleShiftBy((i / 20) * pi2, 300))
        )))
      }

      world.render.add(sink)

      world.anim.fps = 60
      world.anim.speed = .3
      world.anim
        .add(sink.balls)
        .add(sink.boxes1)
        .add(sink.boxes2)
        .add(world.render)
        .start()

      const stop = (e?: MouseEvent) => {
        // if (e.buttons & MouseButtons.Right) {
        e?.preventDefault()
        world.anim.stop().removeAll()
        // }
      }
      world.canvas!.el.oncontextmenu = stop
      return stop
    }
  })
}

