// log.active
import { $, fn, fx } from 'signal'
import { clamp } from 'utils'

export interface AnimItem {
  update(deltaTime: number): number
  draw(t: number): void
}

export class Anim {
  constructor() {
    this.tick = this.tick.bind(this)
  }

  items: AnimItem[] = []
  isAnimating = false

  startTime = 0
  tickTime = 0
  fps = 10
  acc = 0
  get timeStep() {
    return (1000 / this.fps) | 0
  }
  get maxDeltaTime() {
    return this.timeStep * 5
  }

  @fn tick() {
    const { timeStep, maxDeltaTime, tickTime } = this

    let needNextFrame = true

    const now = performance.now()
    const dt = now - tickTime
    this.tickTime = now

    if (dt > maxDeltaTime) {
      //!: discard
      return
    }

    //!: tick
    this.acc += dt

    while (this.acc > timeStep) {
      this.acc -= timeStep
      for (const item of this.items) {
        if (!item.update(dt)) {
          needNextFrame = false
        }
      }
    }

    const t = clamp(0, 1, this.acc / timeStep)

    for (const item of this.items) {
      item.draw(t)
    }

    if (this.isAnimating && needNextFrame) {
      requestAnimationFrame(this.tick)
    }
  }

  start() {
    if (this.isAnimating) return
    //!: start
    this.isAnimating = true
    this.tickTime = this.startTime = performance.now()
    this.tick()
  }

  stop() {
    //!: stop
    this.isAnimating = false
  }
}
