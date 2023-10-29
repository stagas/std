import { $ } from 'signal'
import { Anim } from './anim.ts'
import { Canvas } from './canvas.ts'
import { Pointer } from './pointer.ts'
import { Render } from './render.ts'
import { Screen } from './screen.ts'
import { Skin } from './skin.ts'

export class World {
  skin = $(new Skin)
  screen = $(new Screen)
  anim = $(new Anim)
  render = $(new Render(this))
  canvas?: $<Canvas>
  get pointer() {
    return $(new Pointer(this))
  }
}
