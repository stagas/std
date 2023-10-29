// log.active

export abstract class Animatable {
  need = AnimatableNeed.Idle
  coeff?: number
  public init?(): void
  public tick?(dt: number): AnimatableNeed
  public tickOne(dt: number): void { }
  public draw?(t: number): void
}

export namespace Animatable {
  export interface It {
    animatable: Animatable
  }
}
export const enum AnimatableNeed {
  Idle = 0,
  Init = 1 << 0,
  Tick = 1 << 1,
  Draw = 1 << 2,
}
