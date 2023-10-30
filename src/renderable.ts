// log.active
import { $, fx, of } from 'signal'
import { Canvas } from './canvas.ts'
import { Context } from './context.ts'
import { Point } from './point.ts'
import { Rect } from './rect.ts'
import { Scene } from './scene.ts'

export abstract class Renderable {
  static *traverse(its: Renderable.It[]): Generator<Renderable.It> {
    for (const it of its) {
      const { renderables: rs, renderable: r } = it
      if (rs) yield* Renderable.traverse(rs)
      yield it as any
    }
  }
  constructor(
    public ctx: Context,
    public rect = $(new Rect),
    public canvas = $(new Canvas(ctx.world, rect)),
    public pr = ctx.world.screen.$.pr,
  ) { }
  get prRecip() { return 1 / this.pr }

  scroll?: $<Point>

  viewRect?: $<Rect> // ???

  // state flags
  isVisible?: boolean
  isHidden?: boolean
  didDraw?: boolean

  // need
  need = Need.Idle

  // features
  canDirectDraw?: boolean

  public init?(c: CanvasRenderingContext2D): void
  public render?(c: CanvasRenderingContext2D, t: number, clear: boolean): void
  public draw?(c: CanvasRenderingContext2D, t: number, scroll: Point): void

  @fx trigger_need_Init_on_size() {
    const { pr, canvas } = of(this)
    const { rect: { size: { x, y } } } = of(canvas)
    $()
    this.need |= Need.Init
  }
}

export namespace Renderable {
  export interface It extends Scene {
    renderables?: Renderable.It[]
    renderable?: Renderable
  }
}

export const enum Need {
  Idle = 0,
  Init = 1 << 0,
  Render = 1 << 1,
  Draw = 1 << 2,
}
