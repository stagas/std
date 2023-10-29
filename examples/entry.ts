// log.active
import { ProfileJson } from 'parse-trace'
import { dom, seedRand, timeout } from 'utils'
import { setup } from './balls.js'

// Math.random = seedRand(666)

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

const start = setup()
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
