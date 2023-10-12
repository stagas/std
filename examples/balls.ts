import { $, fn, fx } from 'signal'
import { array, bench, dom, on, randomHex } from 'utils'
import { Circle } from '../src/circle.ts'
import { Point } from '../src/point.ts'
import { World } from '../src/world.ts'
import { Scene } from '../src/scene.ts'

const p = $(new Point)

class Motion {
  @fn update(it: { vel: Point, pos: Point }) {
    const { vel, pos } = it
    vel.mul(0.99)
    if (vel.absSum <= 1) return
    pos.add(vel)
  }
}

class Gravity {
  gravity = 9.8 * (1 / 60) * (20 / 5)

  @fn update(it: { vel: Point }) {
    it.vel.y += this.gravity
  }
}

class Walls {
  constructor(public that: { left: number, right: number, bottom: number }) { }

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
    else if (d > -1.5 && Math.abs(it.vel.y) < 1.5) {
      it.vel.y = 0
      it.bottom = that.bottom
    }

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

class Ball extends Circle {
  get mass() { return 1.3 + (this.rect.size.mag * 0.025) }
  get impactAbsorb() { return ((1 / this.mass) ** 0.25) * 0.999 }
  vel = $(new Point)
  left = this.rect.$.left
  right = this.rect.$.right
  bottom = this.rect.$.bottom
}

class BallScene extends Scene {
  gravity = $(new Gravity)
  motion = $(new Motion)
  walls = $(new Walls(this.canvas))
  balls = array(500, () => $(new Ball, {
    pos: p.rand(this.canvas.size).sub({ x: 0, y: this.canvas.size.h / 2 }).xy,
    radius: 5 + (Math.random() ** 5) * 30,
    fillColor: '#' + randomHex()
    // rect: {
    //   ...p.rand(this.canvas.size).xy,
    //   ...p.rand(50, 5).add(5).wh,
    // }
  }))

  @fx ballFollowsPointer() {
    const { pos } = this.pointer
    const { x, y } = pos
    $.untrack()
    const [ball] = this.balls
    ball.pos.set(pos)
    ball.vel.zero()
  }

  ballCollision() {
    const { balls } = this
    for (let i = 0, c1: Ball; i < balls.length; i++) {
      c1 = balls[i]
      for (let j = i + 1, c2: Ball; j < balls.length; j++) {
        c2 = balls[j]
        if (c1 === c2) continue
        const resp = Circle.toCircleCollision(c1, c2)
        if (resp) {
          if (c1.vel.mag > .75 || c2.vel.mag > .75) {
            c1.vel.mul(0.85).add(resp)
            c2.vel.mul(0.85).add(resp.neg())
          }
          else {
            c1.vel.zero()
            c2.vel.zero()
          }
        }
      }
    }
  }

  @fn reset() {
    const { balls, canvas } = this
    balls.forEach(ball => {
      ball.pos.rand(canvas.size)
    })
  }

  @fn update() {
    const { balls, gravity, motion, walls } = $.of(this)
    let count = 0
    balls.forEach(ball => {
      motion.update(ball)
      gravity.update(ball)
      if (walls.update(ball)) return
      count++
    })
    if (count) {
      this.ballCollision()
    }
    return count
  }

  @fn draw() {
    const { canvas, balls } = $.of(this)
    const { c } = canvas
    canvas.clear()
    balls.forEach(ball => {
      ball.fill(c)
    })
  }
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

function anim() {
  const world = $(new World)
  const scene = $(new BallScene)

  scene.canvas.appendTo(dom.body)

  let animFrame: number
  const tick = () => {
    if (!scene.update()) {
      animFrame = -1
      return
    }
    scene.draw()
    animFrame = requestAnimationFrame(tick)
    // console.log('anim')
  }

  fx(() => {
    if (scene.canvas.size.sum && animFrame === -1) {
      animFrame = requestAnimationFrame(tick)
    }
  })

  tick()

  on(window, 'mousedown', () => {
    if (animFrame >= 0) {
      cancelAnimationFrame(animFrame)
      animFrame = -1
    }
    else {
      requestAnimationFrame(tick)
    }
  })
}

function benchmark1() {
  const scene = $(new BallScene)

  bench('scene', 5, 1000, () => {
    scene.update()
  }, () => {
    scene.reset()
  })
}

function benchmark2() {
  let scene
  bench('scene', 3, 30, () => {
    scene = $(new BallScene)
    $.dispose(scene)
  })
}

anim()
// benchmark1()

// benchmark2()
// 19
