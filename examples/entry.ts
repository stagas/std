// log.active
import { $, fn, init } from 'signal'
import { dom } from 'utils'
import { Pointable } from '../src/pointable.ts'
import { Renderable } from '../src/renderable.ts'
import { Scene } from '../src/scene.ts'
import { World } from '../src/world.ts'
import { BallScene } from './ball-scene.ts'
import { BoxScene } from './box-scene.ts'
import { Box } from './box.ts'

class Balls extends Scene {
  get balls() { return $(new BallScene(this.ctx)) }
  get boxes() { return $(new BoxScene(this.ctx)) }
  get renderables() {
    return [
      this.boxes,
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
    return [this.boxes]
  }
  get pointable() {
    $()
    return $(new Pointable(this))
  }
}

export function setup() {
  return $.batch(() => {
    const world = $(new World)
    const ctx = { world }
    const balls = $(new Balls(ctx))

    for (let i = 0; i < 10; i++) {
      balls.boxes.boxes.push($(new Box(ctx)))
    }

    world.canvas = balls.renderable.canvas
    world.canvas.appendTo(dom.body)

    world.it = balls
    world.input

    return function start() {

      world.render.add(balls)
      // world.render.draw(1)
      // world.render.draw(1)

      world.anim.fps = 30
      world.anim.speed = .2
      // world.anim.add(scene)
      world.anim.add(world.render)
      world.anim.add(balls.balls)
      world.anim.add(balls.boxes)
      world.anim.start()

      const stop = (e?: MouseEvent) => {
        // if (e.buttons & MouseButtons.Right) {
        e?.preventDefault()
        world.anim.stop()
        world.anim.remove(balls.balls)
        world.anim.remove(balls.boxes)
        world.anim.remove(world.render)
        // }
      }
      world.canvas!.el.oncontextmenu = stop
      return stop
    }
  })
}

