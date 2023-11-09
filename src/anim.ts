// log.active
import { $, fn, fx } from 'signal'
import { clamp, maybePush, maybeSplice } from 'utils'
import { Animable } from './animable.ts'

const enum State {
  Idle,
  Starting,
  Stopping,
  Animating,
  NeedNextTick,
}

export class Anim {
  its: Animable.It[] = []
  state = State.Idle
  isPaused = false
  speed = 1
  fps = 60
  acc = 0
  now = 0
  animFrame = -1
  updated = 0
  get coeff() {
    return (60 / this.fps) * this.speed
  }
  get step() {
    return (1000 / this.fps) | 0
  }
  get maxDeltaTime() {
    return this.step * 5
  }
  pause() {
    this.isPaused = true
    return this
  }
  resume() {
    this.isPaused = false
    this.tick()
    return this
  }
  toggle() {
    if (this.isPaused) {
      this.resume()
    }
    else {
      this.pause()
    }
    return this
  }
  get isAnimating() {
    return this.state
  }
  @fn add = (it: Animable.It) => {
    maybePush(this.its, it)
    this.updated++
    return this
  }
  @fn remove = (it: Animable.It) => {
    maybeSplice(this.its, it)
    this.updated++
    return this
  }
  @fx listen_its() {
    if (!this.isAnimating && this.active) {
      $()
      this.start()
      return
    }
  }
  get active() {
    this.updated
    let pass = 0
    for (const it of this.its) {
      // if (it.animable.need) {
      //   console.log(it.constructor.name)
      // }
      pass |= it.animable.need
    }
    return pass
  }
  @fn removeAll() {
    this.its = []
    return this
  }
  @fn start() {
    if (!this.isAnimating) {
      cancelAnimationFrame(this.animFrame)
      this.state = State.Starting
      this.tick()
    }
    return this
  }
  @fn stop() {
    cancelAnimationFrame(this.animFrame)
    this.state = State.Idle
    this.acc = 0
    return this
  }
  @fn tick = (ms?: number) => {
    if (this.isPaused) return

    const { state, its, step, maxDeltaTime, now: before } = this
    let { acc } = this

    const now = ms ?? performance.now()
    const dt = now - before
    this.now = now
    let needNextTick: boolean | undefined = !!this.active

    if (dt > maxDeltaTime) {
      this.animFrame = requestAnimationFrame(this.tick)
      return
    }

    // let needNextTick: boolean | undefined

    if (state === State.Starting) {
      // then start with a full timeStep in the accumulator,
      // so that we get an items update() and have
      // something to draw.
      acc = step + 0.00001
    }
    else {
      acc += dt
    }

    if (acc > step) {
      acc -= step
      for (const { animable: a } of its) {
        if (a.need & Animable.Need.Tick) {
          a.tick?.(dt)
          a.tickOne?.(dt)
        }
      }
    }

    while (acc > step) {
      acc -= step
      for (const { animable: a } of its) {
        a.need & Animable.Need.Tick && a.tick?.(dt)
      }
    }

    const t = clamp(0, 1, (this.acc = acc) / step)

    for (const { animable: a } of its) {
      if (a.init) a.need & Animable.Need.Init && a.init()
      else a.need &= ~Animable.Need.Init
      if (a.draw) a.need & Animable.Need.Draw && a.draw(t)
      else a.need &= ~Animable.Need.Draw
    }

    for (const { animable: a } of its) {
      if (a.need & Animable.Need.Tick) {
        needNextTick = true
        break
      }
    }

    if (needNextTick || this.active) {
      this.state = State.Animating
      this.animFrame = requestAnimationFrame(this.tick)
    }
    else if (state === State.Stopping) {
      this.stop()
    }
    else {
      this.state = State.Stopping
      this.animFrame = requestAnimationFrame(this.tick)
    }
  }

  // @fx print_isAnimating() {
  //   console.log('is animating', this.isAnimating)
  // }
}
