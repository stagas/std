// log.active

export abstract class Animable {
  need = AnimableNeed.Idle
  coeff?: number
  public init?(): void
  public tick?(dt: number): AnimableNeed
  public tickOne(dt: number): void { }
  public draw?(t: number): void
}

export namespace Animable {
  export interface It {
    animable: Animable
  }
}
export const enum AnimableNeed {
  Idle = 0,
  Init = 1 << 0,
  Tick = 1 << 1,
  Draw = 1 << 2,
}
