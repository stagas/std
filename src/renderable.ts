// log.active
import { $, fx, of } from 'signal'
import { Canvas } from './canvas.ts'
import { Dirty } from './dirty.ts'
import { Point } from './point.ts'
import { Rect } from './rect.ts'
import { Scene } from './scene.ts'

export abstract class Renderable {
  static *traverse(its: Renderable.It[]): Generator<Renderable.It> {
    for (const it of its) {
      const { renderable: r } = it
      if (r.its) yield* Renderable.traverse(r.its)
      yield it as any
    }
  }

  // features
  canDirectDraw?: boolean
  scroll?: $<Point>
  dirty = new Dirty(this)

  constructor(
    public it: Renderable.It,
    public rect = $(new Rect),
    public canvas = $(new Canvas(it.ctx.world, rect)),
    public view = rect,
    public pr = it.ctx.world.screen.$.pr,
    public prRecip = it.ctx.world.screen.$.prRecip,
  ) { }

  isVisible?: boolean
  isHidden?: boolean
  didDraw?: boolean

  need = Renderable.Need.Idle

  public init?(c: CanvasRenderingContext2D): void
  public render?(c: CanvasRenderingContext2D, t: number, clear: boolean): void
  public draw?(c: CanvasRenderingContext2D, t: number, scroll: Point): void
  // public before?(c: CanvasRenderingContext2D): void
  // public after?(c: CanvasRenderingContext2D): void

  get its(): Renderable.It[] | undefined { return }

  @fx trigger_need_Init_on_size() {
    const { pr, canvas } = of(this)
    const { rect: { size: { x, y } } } = of(canvas)
    $()
    this.need |= Renderable.Need.Init
  }
}

export namespace Renderable {
  export interface It extends Scene {
    renderable: Renderable
  }
  export const enum Need {
    Idle = 0,
    Init = 1 << 0,
    Render = 1 << 1,
    Draw = 1 << 2,
  }
}
