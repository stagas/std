// log.active

import { $, fx, nu, of } from 'signal'
import { Renderable } from './renderable.ts'
import { Scene } from './scene.ts'

export abstract class Animable {
  static *traverse(its: Animable.It[]): Generator<Animable.It> {
    for (const it of its) {
      const { animable: a } = it
      if (a.its) yield* Animable.traverse(a.its)
      yield it as any
    }
  }
  get its(): Animable.It[] | undefined { return }
  get flatIts() {
    return [...Animable.traverse(this.its ?? [])]
    // .filter(it => !it.renderable || it.renderable.isVisible)
  }

  constructor(public it: Animable.It) { }
  need = Animable.Need.Idle
  // didDraw?: boolean
  public init?(): void
  public tick?(dt: number): void
  public tickOne?(dt: number): void { }
  public draw?(t: number): void

  @nu get anim() {
    const { it } = this
    const { ctx } = of(it)
    const { world } = of(ctx)
    const { anim } = of(world)
    return anim
  }
  @fx trigger_anim_on_need__() {
    // console.log(this.it.constructor.name)
    const { need, anim, it } = of(this)
    const { renderable: r } = it
    $()
    // console.log('YEAHH', need, this.it.constructor.name, r?.isVisible, r?.view.text)
    if (need) {
      if (!r || r.isVisible) {

        // console.warn('TRIGGER ADD', it.constructor.name, need)
        anim.add(it)
      }
      else {
        this.need &= ~(Animable.Need.Tick | Animable.Need.Draw)
      }
    }
    else {
      // console.log('TRIGGER REMOVE', it.constructor.name)
      anim.remove(it)
    }
  }
}

export namespace Animable {
  export interface It extends Scene {
    animable: Animable
    renderable?: Renderable
  }

  export const enum Need {
    Idle = 0,
    Init = 1 << 0,
    Tick = 1 << 1,
    Draw = 1 << 2,
  }
}
