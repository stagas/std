// log.active
import { $, fn, init } from 'signal'
import { dom } from 'utils'
import { Point } from '../src/point.ts'
import { Pointable } from '../src/pointable.ts'
import { Renderable } from '../src/renderable.ts'
import { Scene } from '../src/scene.ts'
import { World } from '../src/world.ts'
import { BallScene } from './ball-scene.ts'
import { BoxScene } from './box-scene.ts'
import { Box } from './box.ts'

class Balls extends Scene {
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
    class BallsRenderable extends Renderable {
      @init init_Balls() {
        this.canvas.fullWindow = true
      }
      @fn init(c: CanvasRenderingContext2D) {
        c.imageSmoothingEnabled = false
        this.need ^= Renderable.Need.Init
      }
    }
    return $(new BallsRenderable(this.ctx))
  }
  get pointables() {
    return [this.boxes1]
  }
  get pointable() {
    $()
    return $(new Pointable(this))
  }
}

const pi2 = Math.PI * 2

export function setup() {
  return $.batch(() => {
    const world = $(new World)
    const ctx = { world }

    const balls = $(new Balls(ctx))
    world.canvas = balls.renderable.canvas
    world.canvas.appendTo(dom.body)
    world.it = balls
    world.input

    return function start() {

      const { center } = world.screen.viewport
      for (let i = 0; i < 20; i++) {
        balls.boxes1.boxes.push($(new Box(ctx,
          $(new Point().set(center)
            .angleShiftBy((i / 20) * pi2, 200))
        )))
      }
      for (let i = 0; i < 20; i++) {
        balls.boxes2.boxes.push($(new Box(ctx,
          $(new Point().set(center)
            .angleShiftBy((i / 20) * pi2, 300))
        )))
      }

      world.render.add(balls)
      // world.render.draw(1)
      // world.render.draw(1)

      world.anim.fps = 30
      world.anim.speed = .2
      world.anim
        .add(balls.balls)
        .add(balls.boxes1)
        .add(balls.boxes2)
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

