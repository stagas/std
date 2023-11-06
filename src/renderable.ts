// log.active
import { $, fn, fx, nu, of, when } from 'signal'
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
  preferDirectDraw?: boolean

  scroll?: $<Point>
  @nu get dirty() {
    const { renders } = when(this)
    $()
    return new Dirty(this)
  }

  constructor(
    public it: Renderable.It,
    public renders = true,
    public rect = renders ? $(new Rect) : it.ctx.world.canvas!.rect,
    public canvas = renders ? $(new Canvas(it.ctx.world, rect)) : it.ctx.world.canvas!,
    public view = rect,
    public pr = it.ctx.world.screen.$.pr,
    public prRecip = it.ctx.world.screen.$.prRecip,
  ) { }

  isVisible?: boolean
  isHidden?: boolean

  didInit = false
  didRender = false
  didDraw = false

  need = Renderable.Need.Idle

  public init?(c: CanvasRenderingContext2D): void
  public render?(c: CanvasRenderingContext2D, t: number, scroll: Point): void
  public draw?(c: CanvasRenderingContext2D, t: number, scroll: Point): void
  @fn clear(c: CanvasRenderingContext2D) {
    this.dirty.clear(c)
  }

  get its(): Renderable.It[] | undefined { return }

  @fx trigger_need_Init_on_size() {
    const { renders } = when(this)
    const { pr, canvas } = of(this)
    const { rect: { size: { x, y } } } = of(canvas)
    $()
    this.need |= Renderable.Need.Init
    log('It', this.it)
  }
}

export namespace Renderable {
  export interface It extends Scene {
    renderable: Renderable
  }
  export const enum Need {
    Idle   = 0,
    Init   = 1 << 0,
    Render = 1 << 1,
    Draw   = 1 << 2,
    Clear  = 1 << 3,
    Paint  = 1 << 4,
  }
}
