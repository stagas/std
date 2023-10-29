// log.active
import { $, nu, of } from 'signal'
import { Animatable } from '../src/animatable.ts'
import { Renderable } from '../src/renderable.ts'
import { Scene } from '../src/scene.ts'
import { Box } from './box.ts'

export class BoxScene extends Scene {
  boxes: Box[] = []

  @nu get renderables(): Renderable.It[] {
    const { boxes } = of(this)
    return boxes
  }

  get renderable() {
    $()
    class BoxSceneRenderable extends Renderable {
      dirtyRects = []
      need = Renderable.Need.Render
    }
    return $(new BoxSceneRenderable(this.ctx))
  }

  get animatable() {
    $()
    class BoxAnimatable extends Animatable {
      need = Animatable.Need.Tick
    }
    return $(new BoxAnimatable)
  }
}
