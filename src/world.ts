import { $, fn, fx, init } from 'signal'
import { Anim } from './anim'
import { Screen } from './screen'

export class World {
  static Current: $<World>
  screen = $(new Screen)
  anim = $(new Anim)
  isAnimating = this.anim.$.isAnimating
  @init init() {
    World.Current = $(this)
  }
}
