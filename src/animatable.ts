// log.active

import { Anim } from './anim.ts'

export abstract class Animatable {
  need = Animatable.Need.Idle
  coeff?: number
  public init?(): void
  public tick?(dt: number): Animatable.Need
  public tickOne(dt: number): void { }
  public draw?(t: number): void
}

export namespace Animatable {
  export interface It {
    animatable: Animatable
  }
  export enum Need {
    Idle = 0,
    Init = 1 << 0,
    Tick = 1 << 1,
    Draw = 1 << 2,
  }
}
