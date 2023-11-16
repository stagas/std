// log.active
import { $, fn, fx, nu, of, when } from 'signal'
import { array, randomHex } from 'utils'
import { Animable } from '../src/animable.ts'
import { Circle } from '../src/circle.ts'
import { Keyboard } from '../src/keyboard.ts'
import { Keyboardable } from '../src/keyboardable.ts'
import { Mouse } from '../src/mouse.ts'
import { Mouseable } from '../src/mouseable.ts'
import { Point, byX, byY } from '../src/point.ts'
import { Renderable } from '../src/renderable.ts'
import { Scene } from '../src/scene.ts'
import { Ball } from './ball.ts'
import { Gravity } from './gravity.ts'
import { Motion } from './motion.ts'
import { Walls } from './walls.ts'

const BALL_TOLERANCE = 5

const p = $(new Point)
const cp = $(new Point)
const cv = $(new Point)

export class BallScene extends Scene
  implements Renderable.It, Mouseable.It, Animable.It, Keyboardable.It {
  get coeff() { return this.ctx.world.anim.coeff }

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
    const { Wheel, Down, Up, Move, Click, Enter, Leave, Menu } = Mouse.EventKind
    class BallSceneMouseable extends Mouseable {
      onMouseEvent(kind: Mouse.EventKind): true | void | undefined {
        const { pos } = this.mouse

        switch (kind) {
          case Move:
            const { balls } = of(it)
            const [ball] = balls
            ball.vel.set(cv.set(pos).sub(ball.pos).mul(3))
            ball.pos.set(pos)
            return true

          case Down:
            return true

          case Up:
            it.ctx.world.keyboard?.textarea.focus()
            return true

          case Click:
            it.addBall(pos)
            return true
        }
      }
    }
    return $(new BallSceneMouseable(it as Mouseable.It))
  }
  get keyboardable() {
    $()
    const it = this
    const { Down, Up, Copy, Cut, Paste } = Keyboard.EventKind
    const { Char, Special } = Keyboard.KeyKind
    class BallSceneKeyboardable extends Keyboardable {
      onKeyboardEvent(kind: Keyboard.EventKind): true | void | undefined {
        const { key, char, special, alt, ctrl, shift } = this.keypress

        switch (kind) {
          case Down:
            if (ctrl && shift && char === 'J') {
              return true
            }
            break

          case Up:
            switch (key?.kind) {
              case Char:
                this.keypress.textarea.value = ''
                return true
            }
            break

          case Copy:
            console.log('COPY')
            return true

          case Cut:
            console.log('CUT')
            return true

          case Paste:
            console.log('PASTE')
            return true
        }
      }
    }
    return $(new BallSceneKeyboardable(it as Keyboardable.It))
  }
  get renderable() {
    $()
    const it = this
    class BallsSceneRenderable extends Renderable {
      @nu get its() {
        const { balls } = of(it)
        return balls
      }
    }
    return $(new BallsSceneRenderable(it as Renderable.It, false))
  }
  get animable() {
    $()
    const it = this
    return $(new BallSceneAnimable(it))
  }
}

class BallSceneAnimable extends Animable {
  constructor(public it: BallScene) { super(it) }
  need = Animable.Need.Tick
  @fn tick() {
    const { gravity, motion, walls, balls, ctx: { world: { mouse } } } = this.it
// console.log('tick')
    let need = 0
    cp.set(balls[0].pos)
    for (const ball of balls) {
      if (walls.update(ball)) continue
      gravity.update(ball)
      motion.update(ball)
      need = Animable.Need.Tick
    }
    if (performance.now() - mouse!.pointer!.time < 2000) {
      balls[0].pos.set(cp)
    }

    if (!need) {
      this.need &= ~Animable.Need.Draw
    }
    else {
      this.need = Animable.Need.Tick | Animable.Need.Draw
    }
  }
  @fn tickOne() {
    const {
      balls,
      x_sorted: xs,
      y_sorted: ys,
      ctx: { world: { anim, mouse } }
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

    if (anim.now - mouse!.pointer!.time < 2000) {
      balls[0].pos.set(cp)
    }

    for (const ball of balls) {
      ball.circle.lerpPos.p1.set(ball.circle.lerpPos.p2)
      ball.circle.lerpPos.p2.set(ball.pos)
    }
  }
  @fn draw() {
    const { balls } = this.it

    for (const ball of balls) {
      ball.renderable.need |= Renderable.Need.Render
    }
    // world.canvas!.clear()
    // world.render.draw()
  }
}
