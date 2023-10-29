// log.active
import { $, fn, nu, of } from 'signal'
import { Animatable, AnimatableNeed } from '../src/animatable.ts'
import { Mouse } from '../src/mouse.ts'
import { Point } from '../src/point.ts'
import { Pointable } from '../src/pointable.ts'
import { Renderable } from '../src/renderable.ts'
import { Scene } from '../src/scene.ts'
import { Box } from './box.ts'

export class BoxScene extends Scene {
  boxes: Box[] = []
  speed = 0.04

  @nu get renderables(): Renderable.It[] {
    return of(this).boxes
  }

  get renderable() {
    $()
    const it = this
    const { canvas } = of(it.ctx.world)
    class BoxSceneRenderable extends Renderable {
      isVisible = true
      scroll = $(new Point)
    }
    return $(new BoxSceneRenderable(
      it.ctx,
      canvas.rect,
      canvas,
    ))
  }

  get animatable() {
    $()
    const it = this
    let phase = 0
    const pi2 = Math.PI * 2
    const { ctx: { world: { screen: { viewport } } } } = it
    class BoxSceneAnimatable extends Animatable {
      need = AnimatableNeed.Tick
      @fn tick(t: number) {
        let i = 0
        const { center } = viewport
        for (const box of it.boxes) {
          box.pos.set(center)
            .angleShiftBy(
              (i++ / it.boxes.length) * pi2 - phase,
              Math.cos(phase) * 400
            )
        }
        return AnimatableNeed.Tick
      }
      tickOne(dt: number) {
        phase += it.speed
        phase %= pi2
        it.renderable.scroll.zero().angleShiftBy(phase, 100)
      }
    }
    return $(new BoxSceneAnimatable)
  }

  get pointable() {
    $()
    const it = this
    const { scroll } = it.renderable
    class BoxScenePointable extends Pointable {
      hitArea = it.ctx.world.canvas!.rect
      onMouseEvent(kind: Mouse.EventKind) {
        switch (kind) {
          case Mouse.EventKind.Wheel:
            const { mouse: { wheel } } = this
            scroll.add(wheel)
            // console.log(wheel.text)
            break
        }
      }
    }
    return $(new BoxScenePointable(this))
  }
}
