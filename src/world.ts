import { $, fx, nu, of } from 'signal'
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
import { Keyboard } from './keyboard.ts'

export class World {
  it?: World.It
  skin = $(new Skin)
  anim = $(new Anim)
  screen = $(new Screen)
  @nu get render() {
    const { it } = of(this)
    const { ctx } = of(it)
    $()
    return $(new Render(ctx))
  }
  canvas?: $<Canvas>
  pointer?: $<Pointer>
  keyboard?: $<Keyboard>
  @nu get mouse(): $<Mouse> | undefined {
    const { it } = of(this)
    return $(new Mouse(it))
  }
  @fx update_mouse() {
    const { it, mouse } = of(this)
  }
}

export namespace World {
  export interface It {
    ctx: Context
    renderable: Renderable
    mouseable: Mouseable
  }
}
