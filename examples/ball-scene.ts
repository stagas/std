// log.active
import { $, fn, fx, nu, of, when } from 'signal'
import { array, on, randomHex } from 'utils'
import { Animable, AnimableNeed } from '../src/animable.ts'
import { Circle } from '../src/circle.ts'
import { Point, byX, byY } from '../src/point.ts'
import { Renderable } from '../src/renderable.ts'
import { Scene } from '../src/scene.ts'
import { Ball } from './ball.ts'
import { Gravity } from './gravity.ts'
import { Motion } from './motion.ts'
import { Walls } from './walls.ts'
import { Mouseable } from '../src/mouseable.ts'
import { Mouse } from '../src/mouse.ts'

const BALL_TOLERANCE = 5

const p = $(new Point)
const cp = $(new Point)
const cv = $(new Point)

export class BallScene extends Scene
  implements Renderable.It, Mouseable.It, Animable.It {
  get coeff() { return this.animable.coeff }

  gravity = $(new Gravity)
  motion = $(new Motion)

  @nu get walls() {
    const { canvas } = of(this.renderable)
    const { rect } = of(canvas)
    const { hasSize } = when(canvas.rect.size)
    $()
    return $(new Walls(rect))
  }

  count?: number
  balls: $<Ball>[] = []
  x_sorted: $<Ball>[] = []
  y_sorted: $<Ball>[] = []

  @fn ballProps() {
    const { canvas } = of(this.renderable)
    return {
      pos: p.rand(canvas.rect.size).sub({ x: 0, y: canvas.rect.size.h / 2 }).xy,
      radius: 12 + (Math.random() ** 2.5) * 42,
      circle: { fillColor: '#' + randomHex() }
    }
  }
  @fx createBalls() {
    const { count, ctx, renderable: r } = when(this)
    const { canvas } = r
    const { hasSize } = when(canvas.rect)
    $()
    this.balls = array(count, () =>
      $(new Ball(ctx), this.ballProps()))
  }
  @fx update_xy_sorted() {
    const { balls } = $.of(this)
    $()
    this.x_sorted = [...balls]
    this.y_sorted = [...balls]
  }
  @fn addBall(pos?: Point) {
    const { balls, ctx } = of(this)
    const ball = $(new Ball(ctx), this.ballProps())
    $.flush() // ball.pos isn't ready yet
    this.balls = [ball, ...balls]
    if (pos) {
      ball.pos.set(pos)
      ball.circle.lerpPos.p1.set(pos)
      ball.circle.lerpPos.p2.set(pos)
    }
  }
  // TODO: in animatable
  @fx assignCoeff() {
    const { coeff, gravity, motion, balls } = of(this)
    gravity.coeff
      = motion.coeff
      = coeff
    balls.forEach(ball => {
      ball.coeff = coeff
    })
  }
  @fn reset() {
    const { balls, renderable: r } = of(this)
    const { canvas } = r
    balls.forEach(ball => {
      ball.pos.rand(canvas.rect.size)
    })
  }
  get mouseable() {
    $()
    const it = this
    class BallSceneMouseable extends Mouseable {
      hitArea = it.renderable.rect
      public onMouseEvent(kind: Mouse.EventKind): true | void | undefined {
        const { mouse: { pos } } = of(this)

        switch (kind) {
          case Mouse.EventKind.Move:
            const { balls } = of(it)
            const [ball] = balls
            ball.vel.set(cv.set(pos).sub(ball.pos).mul(3))
            ball.pos.set(pos)
            return true

          case Mouse.EventKind.Down:
            return true

          case Mouse.EventKind.Click:
            it.addBall(pos)
            return true
        }
      }
    }
    return $(new BallSceneMouseable(this))
  }
  @nu get renderables(): Renderable.It[] {
    const { balls } = of(this)
    return balls
  }
  get renderable() {
    $()
    class BallsSceneRenderable extends Renderable {
      isVisible = true
      // dirtyRects = []
      // @init init_Balls() {
      //   this.canvas.fullWindow = true
      // }
      // @fn init(c: CanvasRenderingContext2D) {
      //   c.imageSmoothingEnabled = false
      //   this.need ^= Renderable.Need.Init
      // }
    }
    return $(new BallsSceneRenderable(
      this.ctx,
      this.ctx.world.canvas!.rect,
      this.ctx.world.canvas!
    ))
  }
  get animable() {
    $()
    return $(new BallSceneAnimable(this))
  }
}

class BallSceneAnimable extends Animable {
  constructor(public it: BallScene) { super() }
  need = AnimableNeed.Tick
  @fn tick() {
    const { gravity, motion, walls, balls } = this.it

    let need = 0
    cp.set(balls[0].pos)
    for (const ball of balls) {
      if (walls.update(ball)) continue
      gravity.update(ball)
      motion.update(ball)
      need |= AnimableNeed.Tick
    }
    if (performance.now() - this.it.ctx.world.pointer!.event.timeStamp < 2000) {
      balls[0].pos.set(cp)
    }
    if (!need) this.need ^= AnimableNeed.Draw
    else this.need = AnimableNeed.Tick | AnimableNeed.Draw

    return need
  }
  @fn tickOne() {
    const {
      balls,
      x_sorted: xs,
      y_sorted: ys,
      ctx: { world: { anim, pointer } }
    } = this.it

    for (const ball of balls) {
      ball.colls.clear()
    }

    cp.set(balls[0].pos)

    const MAX_COLS = 45
    xs.sort(byX)
    let len = xs.length
    let len_m1 = len - 1
    for (let i = 0, c1: $<Ball>; i < len_m1; i++) {
      c1 = xs[i]
      if (c1.colls.size > MAX_COLS) continue
      for (let j = i + 1, c2: $<Ball>; j < len; j++) {
        c2 = xs[j]
        if (c2.colls.size > MAX_COLS) continue
        if (c1.colls.has(c2) || c2.colls.has(c1)) continue
        c1.colls.add(c2)
        c2.colls.add(c1)
        if (c2.left > c1.right) {
          break
        }
        Circle.toCircleCollision(c1, c2, BALL_TOLERANCE)
        if (c1.colls.size > MAX_COLS) break
      }
    }

    ys.sort(byY)
    for (let i = 0, c1: $<Ball>; i < len_m1; i++) {
      c1 = ys[i]
      if (c1.colls.size > MAX_COLS) continue
      for (let j = i + 1, c2: $<Ball>; j < len; j++) {
        c2 = ys[j]
        if (c2.colls.size > MAX_COLS) continue
        if (c1.colls.has(c2) || c2.colls.has(c1)) continue
        c1.colls.add(c2)
        c2.colls.add(c1)
        if (c2.top > c1.bottom) {
          break
        }
        Circle.toCircleCollision(c1, c2, BALL_TOLERANCE)
        if (c1.colls.size > MAX_COLS) break
      }
    }

    if (anim.now - pointer!.event.timeStamp < 2000) {
      balls[0].pos.set(cp)
    }

    for (const ball of balls) {
      ball.circle.lerpPos.p1.set(ball.circle.lerpPos.p2)
      ball.circle.lerpPos.p2.set(ball.pos)
    }
  }
  // @fn draw() {
  //   // world.canvas!.clear()
  //   // world.render.draw()
  // }
}
