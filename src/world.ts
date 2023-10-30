import { $, nu, of } from 'signal'
import { Anim } from './anim.ts'
import { Canvas } from './canvas.ts'
import { Context } from './context.ts'
import { Mouse } from './mouse.ts'
import { Mouseable } from './mouseable.ts'
import { Pointer } from './pointer.ts'
import { Render } from './render.ts'
import { Renderable } from './renderable.ts'
import { Screen } from './screen.ts'
import { Skin } from './skin.ts'

export class World {
  it?: World.It
  skin = $(new Skin)
  screen = $(new Screen)
  anim = $(new Anim)
  render = $(new Render(this))
  canvas?: $<Canvas>
  get pointer() {
    return $(new Pointer(this))
  }
  @nu get input() {
    const { it } = of(this)
    return {
      mouse: $(new Mouse(it))
    }
  }
}

export namespace World {
  export interface It {
    ctx: Context
    renderable: Renderable
    mouseable: Mouseable
  }
}
