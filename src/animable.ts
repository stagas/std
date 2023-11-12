// log.active

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
  }

  constructor(public it: Animable.It) { }
  need = Animable.Need.Idle
  didDraw?: boolean
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
