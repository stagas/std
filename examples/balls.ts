// log.active
import { ProfileJson } from 'parse-trace'
import { $ } from 'signal'
import { dom, timeout } from 'utils'
import { World } from '../src/world.ts'
import { BallScene } from './ball-scene.ts'
import { BoxScene } from './box-scene.ts'
import { Box } from './box.ts'

const style = document.createElement('style')
dom.head.append(style)
style.textContent = /*css*/`
html, body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
`

function start() {
  const world = $(new World)
  const ctx = { world }
  const scene = $(new BallScene(ctx))
  const boxs = $(new BoxScene(ctx))
  for (let i = 0; i < 50; i++) {
    boxs.boxes.push($(new Box(ctx)))
  }
  world.canvas = scene.renderable.canvas
  world.canvas.appendTo(dom.body)
  world.render.add(boxs)
  world.render.add(scene)
  // world.render.draw(1)
  // world.render.draw(1)

  world.anim.fps = 30
  world.anim.speed = .2
  world.anim.add(boxs)
  world.anim.add(scene)
  world.anim.add(world.render)
  world.anim.start()

  const stop = (e?: MouseEvent) => {
    // if (e.buttons & MouseButtons.Right) {
    e?.preventDefault()
    world.anim.stop()
    world.anim.remove(scene)
    world.anim.remove(world.render)
    // }
  }
  world.canvas.el.oncontextmenu = stop

  return stop
}

// function benchmark1() {
//   const scene = $(new BallScene)

//   bench('scene', 5, 1000, () => {
//     scene.update(1)
//   }, () => {
//     scene.reset()
//   })
// }

// function benchmark2() {
//   let scene
//   bench('scene', 3, 30, () => {
//     scene = $(new BallScene)
//     $.dispose(scene)
//   })
// }

const stop = start()
// benchmark1()

declare function parseTrace(secs: number): Promise<ProfileJson>
declare function readTextFile(filepath: string): Promise<string>

// benchmark2()
// 19
export async function test_balls() {
  // @env browser
  describe('perf', () => {
    jest.setTimeout(30000)
    it('balls', async () => {
      await timeout(3000)
      await parseTrace(5)
    })
  })
}
