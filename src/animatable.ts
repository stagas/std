// log.active

export abstract class Animatable {
  need = Animatable.Need.Idle
  coeff?: number
  public init?(): void
  public tick?(dt: number): number
  public tickOne(dt: number): number { return 0 }
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
