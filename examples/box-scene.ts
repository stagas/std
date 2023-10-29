// log.active
import { $, fn, nu, of } from 'signal'
import { Animatable } from '../src/animatable.ts'
import { Mouse } from '../src/mouse.ts'
import { Point } from '../src/point.ts'
import { Pointable } from '../src/pointable.ts'
import { Renderable } from '../src/renderable.ts'
import { Scene } from '../src/scene.ts'
import { Box } from './box.ts'

export class BoxScene extends Scene {
  boxes: Box[] = []

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
    class BoxSceneAnimatable extends Animatable {
      need = Animatable.Need.Tick
      @fn tick() {
        // console.log('tick')
        return Animatable.Need.Tick
      }
      @fn tickOne(dt: number) {
        // console.log('TICK ONE')
        phase += 0.04
        phase %= Math.PI * 2
        it.renderable.scroll.y = Math.sin(phase) * 100 - 100
        it.renderable.scroll.x = Math.cos(phase) * 100 - 100
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
