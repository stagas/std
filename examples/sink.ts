// log.active
import { $, fn, fx, init } from 'signal'
import { dom } from 'utils'
import { Mouse } from '../src/mouse.ts'
import { Point } from '../src/point.ts'
import { Mouseable } from '../src/mouseable.ts'
import { Need, Renderable } from '../src/renderable.ts'
import { Scene } from '../src/scene.ts'
import { World } from '../src/world.ts'
import { BallScene } from './ball-scene.ts'
import { BoxScene } from './box-scene.ts'
import { Box } from './box.ts'
import { Rect } from '../src/rect.ts'

class Sink extends Scene {
  get balls() { return $(new BallScene(this.ctx)) }
  get boxes1() { $(); return $(new BoxScene(this.ctx), { speed: 0.006 }) }
  get boxes2() { $(); return $(new BoxScene(this.ctx), { speed: 0.012 }) }
  get renderables() {
    return [
      this.boxes1,
      this.boxes2,
      this.balls,
    ]
  }
  get renderable() {
    $()
    const it = this
    class BallsRenderable extends Renderable {
      scroll = $(new Point)
      @init init_Balls() {
        this.canvas.fullWindow = true
      }
      // @fx trigger_draw_on_scroll() {
      //   const { xy } = this.scroll
      //   console.log('fired')
      //   for (const { renderable: r, renderables: rs } of Renderable.traverse(it.renderables)) {
      //     if (r) $.untrack(() => { r.need |= Need.Draw })
      //   }
      // console.log(it.balls)
      // }
      @fn init(c: CanvasRenderingContext2D) {
        c.imageSmoothingEnabled = false
        this.need ^= Need.Init
      }
    }
    return $(new BallsRenderable(this.ctx))
  }
  get mouseables() {
    return [this.balls]
  }
  get mouseable() {
    $()
    const it = this
    const p = $(new Point)
    class BallsMouseable extends Mouseable {
      hitArea = it.renderable.rect
      onMouseEvent(kind: Mouse.EventKind): true | void | undefined {
        switch (kind) {
          case Mouse.EventKind.Wheel:
            it.renderable.scroll.add(p.set(this.mouse.wheel).mul(0.2)).round()
            break
        }
      }
    }
    return $(new BallsMouseable(this))
  }
}

const pi2 = Math.PI * 2

export function setup() {
  return $.batch(() => {
    const world = $(new World)
    const ctx = { world }

    const sink = $(new Sink(ctx))
    world.canvas = sink.renderable.canvas
    world.canvas.appendTo(dom.body)
    world.it = sink
    world.input

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
      // sink.boxes1.fixedBoxes = [...sink.boxes1.fixedBoxes]
      // sink.boxes1.boxes = [...sink.boxes1.boxes]
      // sink.boxes2.boxes = [...sink.boxes2.boxes]

      world.render.add(sink)
      // world.render.draw(1)
      // world.render.draw(1)

      world.anim.fps = 30
      world.anim.speed = .2
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

