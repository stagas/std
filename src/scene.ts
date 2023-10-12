import { $, fn, fx } from 'signal'
import { World } from './world'
import { Canvas } from './canvas'
import { Pointer } from './pointer'

export class Scene {
  world = World.Current
  canvas = $(new Canvas, { fullWindow: true })
  pointer = $(new Pointer(this.canvas))
}
