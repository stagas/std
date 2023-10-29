log.active
import { ProfileJson } from 'parse-trace'
import { $, fn, fx, init, nu, of, when } from 'signal'
import { array, dom, on, randomHex, timeout } from 'utils'
import { Anim } from '../src/anim.ts'
import { Animatable } from '../src/animatable.ts'
import { Circle } from '../src/circle.ts'
import { Context } from '../src/context.ts'
import { Point, byX, byY } from '../src/point.ts'
import { Rect } from '../src/rect.ts'
import { Renderable } from '../src/renderable.ts'
import { Scene } from '../src/scene.ts'
import { World } from '../src/world.ts'

const BALL_COUNT = 40 //150
const BALL_TOLERANCE = 5
const BALL_HOLD_TOLERANCE = 8
const GRID_CELL_BITS = 2

const p = $(new Point)
const cp = $(new Point)
const cv = $(new Point)

class Motion {
  coeff = 1
  @fn update(it: { vel: Point, pos: Point }) {
    const { vel, pos } = it
    vel.mul(0.98)
    // if (vel.absSum <= 1) return
    pos.add(p.set(vel).mul(this.coeff))
  }
}

class Gravity {
  coeff = 1
  gravity = 9.8 * (1 / 60) * (80 / 5)
  @fn update(it: { vel: Point }) {
    it.vel.y += this.gravity * this.coeff
  }
}

class Walls {
  constructor(public that: Rect) { }

  @fn update(it: { vel: Point, impactAbsorb: number, left: number, right: number, bottom: number, mass: number }) {
    const { that } = this

    if (it.vel.y < 1 && it.bottom === that.bottom) {
      return true
    }

    let d = it.bottom - that.bottom

    if (d > 0) {
      it.bottom = that.bottom
      it.vel.y = -it.vel.y * it.impactAbsorb
    }
    // else if (d > -1.5 && Math.abs(it.vel.y) < 1.5) {
    //   it.vel.y = 0
    //   it.bottom = that.bottom
    // }

    d = that.left - it.left

    if (d > 0) {
      it.left = that.left
      it.vel.x = -it.vel.x * it.impactAbsorb
    }
    else {

      d = it.right - that.right

      if (d > 0) {
        it.right = that.right
        it.vel.x = -it.vel.x * it.impactAbsorb
      }
    }
  }
}

let ballId = 0

class Ball extends Scene {
  id = ++ballId
  circle = $(new Circle)
  radius = this.circle.$.radius
  pos = this.circle.rect.center
  x = this.pos.$.x
  y = this.pos.$.y
  left = this.circle.rect.$.left
  top = this.circle.rect.$.top
  right = this.circle.rect.$.right
  bottom = this.circle.rect.$.bottom

  coeff = 1
  get mass() { return 1.3 + (this.circle.rect.size.mag * 0.025) * this.coeff }
  get impactAbsorb() { return ((1 / this.mass) ** 0.25) * 0.919 }
  vel = $(new Point)
  colls = new Set<Ball>() //

  get renderable() {
    $()
    return $(new BallRenderable(this, this.ctx), {
      rect: { size: this.circle.rect.size.xy }
    })
  }
}

class BallRenderable extends Renderable {
  constructor(public it: Ball, public ctx: Context) {
    super(ctx)
  }
  @fx setup() {
    const { it } = this
    const { hasSize } = when(it.circle.rect)
    $()
    it.circle.lerpPos.p1.set(it.pos).round()
    it.circle.lerpPos.p2.set(it.pos).round()
  }
  @fn init(c: CanvasRenderingContext2D) {
    const { Need: { Init } } = Renderable
    c.imageSmoothingEnabled = false
    this.need ^= Init
  }
  @fn render(c: CanvasRenderingContext2D) {
    const { Need: { Render } } = Renderable
    const { it } = this
    const { circle } = it
    const { radius: r } = circle
    c.save()
    c.translate(r, r)
    circle.fill(c)
    c.restore()
    this.need ^= Render
  }
  @fn draw(c: CanvasRenderingContext2D, t: number) {
    const { it, canvas, rect, pr, dirtyRects: [dr] } = of(this)
    it.circle.lerpPos.lerp(t)
    rect.center.set(it.circle.lerpPos.lerpPoint.round())
    rect.round().drawImage(canvas.el, c, pr, true)
    dr.set(rect)
  }
}

// function areNear(c1: Ball, c2: Ball) {
//   return (
//     c1 !== c2
//     && c1.gridCells.includes(c2.gridCells[4])
//   )
// }

class BallScene extends Scene {
  get coeff() { return this.animatable.coeff }

  gravity = $(new Gravity)
  motion = $(new Motion)

  @nu get walls() {
    const { canvas } = of(this.renderable)
    const { rect } = of(canvas)
    const { hasSize } = when(canvas.rect.size)
    $()
    return $(new Walls(rect))
  }

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
    const { ctx, renderable: r } = of(this)
    const { canvas } = r
    const { hasSize } = when(canvas.rect)
    $()
    this.balls = array(BALL_COUNT, () =>
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

  //
  // Behaviors.
  //

  @fx onClickAddBall() {
    return on(window, 'click', () =>
      this.addBall(this.ctx.world.pointer.pos)
    )
  }

  @fx ballFollowsPointer() {
    const { pos } = this.ctx.world.pointer
    const { x, y } = pos
    $()
    const [ball] = $.of(this).balls
    ball.vel.set(cv.set(pos).sub(ball.pos).mul(3))
    ball.pos.set(pos)
    // this.animatable.draw(1)
  }

  // End Behaviors.

  @fn reset() {
    const { balls, renderable: r } = of(this)
    const { canvas } = r
    balls.forEach(ball => {
      ball.pos.rand(canvas.rect.size)
    })
  }

  @nu get renderables(): Renderable.It[] {
    const { balls } = of(this)
    return balls
  }

  get renderable() {
    $()
    class BallsSceneRenderable extends Renderable {
      dirtyRects = []
      @init init_Balls() {
        this.canvas.fullWindow = true
      }
      @fn init(c: CanvasRenderingContext2D) {
        c.imageSmoothingEnabled = false
        this.need ^= Renderable.Need.Init
      }
    }
    return $(new BallsSceneRenderable(this.ctx))
  }

  get animatable(): Animatable {
    $()
    return $(new BallSceneAnimatable(this))
  }
}

class BallSceneAnimatable extends Animatable {
  constructor(public it: BallScene) { super() }
  need = Animatable.Need.Tick
  @fn tick() {
    const { gravity, motion, walls, balls } = this.it

    let need = 0
    cp.set(balls[0].pos)
    for (const ball of balls) {
      if (walls.update(ball)) continue
      gravity.update(ball)
      motion.update(ball)
      need |= Anim.State.NeedNextTick
    }
    if (performance.now() - this.it.ctx.world.pointer.event.timeStamp < 2000) {
      balls[0].pos.set(cp)
    }
    if (!need) this.need ^= Animatable.Need.Draw
    else this.need = Animatable.Need.Tick | Animatable.Need.Draw
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

    if (anim.now - pointer.event.timeStamp < 2000) {
      balls[0].pos.set(cp)
    }

    for (const ball of balls) {
      ball.circle.lerpPos.p1.set(ball.circle.lerpPos.p2)
      ball.circle.lerpPos.p2.set(ball.pos)
    }

    return Anim.State.NeedNextTick
  }
  // @fn draw() {
  //   // world.canvas!.clear()
  //   // world.render.draw()
  // }
}

const style = document.createElement('style')
dom.head.append(style)
style.textContent = /*css*/`
html, body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
`

function start() {
  const world = $(new World)
  const ctx = { world }
  // $.flush()

  const scene = $(new BallScene(ctx))

  world.canvas = scene.renderable.canvas
  world.canvas.appendTo(dom.body)
  world.render.add(scene)
  world.render.draw(1)
  world.render.draw(1)

  world.anim.fps = 30
  world.anim.speed = .2
  world.anim.add(scene)
  world.anim.add(world.render)
  world.anim.start()

  const stop = (e?: MouseEvent) => {
    // if (e.buttons & MouseButtons.Right) {
    e?.preventDefault()
    world.anim.stop()
    world.anim.remove(scene)
    world.anim.remove(world.render)
    // }
  }
  world.canvas.el.oncontextmenu = stop

  return stop
}

// function benchmark1() {
//   const scene = $(new BallScene)

//   bench('scene', 5, 1000, () => {
//     scene.update(1)
//   }, () => {
//     scene.reset()
//   })
// }

// function benchmark2() {
//   let scene
//   bench('scene', 3, 30, () => {
//     scene = $(new BallScene)
//     $.dispose(scene)
//   })
// }

const stop = start()
// benchmark1()

declare function parseTrace(secs: number): Promise<ProfileJson>
declare function readTextFile(filepath: string): Promise<string>

// benchmark2()
// 19
export async function test_balls() {
  // @env browser
  describe('perf', () => {
    jest.setTimeout(30000)
    it('balls', async () => {
      await timeout(3000)
      await parseTrace(5)
    })
  })
}
