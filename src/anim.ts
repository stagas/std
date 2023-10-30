// log.active
import { $, fn } from 'signal'
import { clamp, maybePush, maybeSplice } from 'utils'
import { Animatable, AnimatableNeed } from './animatable.ts'

export class Anim {
  its: Animatable.It[] = []
  state = AnimState.Idle

  tickTime = 0
  speed = 1
  acc = 0
  fps = 60
  now = 0

  get coeff() {
    return (60 / this.fps) * this.speed
  }
  get timeStep() {
    return (1000 / this.fps) | 0
  }
  get maxDeltaTime() {
    return this.timeStep * 5
  }
  @fn tick = () => {
    // const { Need: { Init, Tick, Draw } } = Animatable
    // const { State: { Starting, NeedNextTick } } = Anim
    const { its, timeStep, maxDeltaTime, tickTime, coeff } = this
    let { state, acc } = this

    const now = this.now = performance.now()
    const dt = now - tickTime
    this.tickTime = now

    state ^= AnimState.NeedNextTick

    if (dt > maxDeltaTime) {
      requestAnimationFrame(this.tick)
      return
    }

    // let needNextTick: boolean | undefined

    if (state & AnimState.Starting) {
      // then start with a full timeStep in the accumulator,
      // so that we get an items update() and have
      // something to draw.
      acc = timeStep + 0.00001
    }
    else {
      acc += dt
    }

    if (acc > timeStep) {
      acc -= timeStep
      let res: number
      for (const { animatable: a } of its) {
        if (a.need & AnimatableNeed.Tick) {
          a.coeff = coeff
          res = a.tick?.(dt)!
          if (res & AnimatableNeed.Tick) {
            state |= AnimState.NeedNextTick
            a.tickOne(dt)
          }
        }
      }
    }

    while (acc > timeStep) {
      acc -= timeStep
      for (const { animatable: a } of its) {
        a.need & AnimatableNeed.Tick && (state |= a.tick?.(dt)!)
      }
    }

    const t = clamp(0, 1, (this.acc = acc) / timeStep)

    for (const { animatable: a } of its) {
      a.need & AnimatableNeed.Init && a.init?.()
      a.need & AnimatableNeed.Draw && a.draw?.(t)
    }

    if (state & AnimState.NeedNextTick) {
      this.state |= AnimState.Animating
      requestAnimationFrame(this.tick)
    }
    else if (state & AnimState.Stopping) {
      this.state = AnimState.Idle
      this.stop()
    }
    else {
      this.state |= AnimState.Stopping
      requestAnimationFrame(this.tick)
    }
  }
  @fn add(it: Animatable.It) {
    maybePush(this.its, it)
    return this
  }
  @fn remove(it: Animatable.It) {
    maybeSplice(this.its, it)
    return this
  }
  @fn removeAll() {
    this.its.splice(0)
    return this
  }
  @fn start() {
    const { state } = this
    if (state & (AnimState.Animating | AnimState.Starting)) return
    this.state = AnimState.Starting
    this.tick()
    return this
  }
  @fn stop() {
    this.state = AnimState.Idle
    this.acc = 0
    return this
  }

  // @fx print_isAnimating() {
  //   console.log('is animating', this.isAnimating)
  // }
}

export const enum AnimState {
  Idle = 0,
  Starting = 1 << 0,
  Stopping = 1 << 1,
  Animating = 1 << 2,
  NeedNextTick = 1 << 3,
}
// export namespace Anim {
// }
