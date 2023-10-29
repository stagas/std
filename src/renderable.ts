log.active
import { $, fx, init, of } from 'signal'
import { Canvas } from './canvas.ts'
import { Context } from './context.ts'
import { Rect } from './rect.ts'
import { Scene } from './scene.ts'

export class DirtyRect extends Rect {
  constructor(public owner: Renderable) { super() }
}

export abstract class Renderable {
  constructor(
    public ctx: Context,
    public rect = $(new Rect),
    public canvas = $(new Canvas(ctx.world, rect)),
    public pr = ctx.world.screen.$.pr,
  ) { }
  get prRecip() { return 1 / this.pr }
  dirtyRects: $<DirtyRect>[] = [$(new DirtyRect(this))]
  viewRect?: $<Rect>

  // position
  position = Renderable.Position.Fixed

  // state flags
  isVisible?: boolean
  isHidden?: boolean
  didDraw?: boolean

  // need
  need = Renderable.Need.Idle

  // features
  canDirectDraw?: boolean

  public init?(c: CanvasRenderingContext2D): void
  public render?(c: CanvasRenderingContext2D, t: number, clear: boolean): void
  public draw?(c: CanvasRenderingContext2D, t: number): void

  // @init set_initial_dirtyRects() {
  //   if (!this.dirtyRects.length) {
  //     this.dirtyRects.push(this.viewRect ?? this.rect)
  //   }
  // }
  @fx trigger_need_Init_on_size() {
    const { pr, canvas } = of(this)
    const { rect: { size: { x, y } } } = of(canvas)
    $()
    this.need |= Renderable.Need.Init
  }
}

export namespace Renderable {
  export interface It extends Scene {
    renderables?: Renderable.It[]
    renderable?: Renderable
  }
  export enum Position {
    /** Fixed in space, no transformations. */
    Fixed,
    /** Translations apply. */
    Translated
  }
  export enum Need {
    Idle = 0,
    Init = 1 << 0,
    Render = 1 << 1,
    Draw = 1 << 2,
  }
}
