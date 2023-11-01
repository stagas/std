// log.active

export abstract class Animable {
  constructor(public it: Animable.It) { }
  need = Animable.Need.Idle
  public init?(): void
  public tick?(dt: number): void
  public tickOne?(dt: number): void { }
  public draw?(t: number): void
}

export namespace Animable {
  export interface It {
    animable: Animable
  }

  export const enum Need {
    Idle = 0,
    Init = 1 << 0,
    Tick = 1 << 1,
    Draw = 1 << 2,
  }
}
