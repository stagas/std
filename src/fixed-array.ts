import { partialIncludes, partialSort, poolArrayGet } from 'utils'

// We compose with a regular Array instead of extending Array
// because it's possibly better optimized.
export class FixedArray<T> {
  array: T[] = []
  count = 0
  updated = 0
  get(i: number, factory: () => T) {
    return poolArrayGet(this.array, i, factory)
  }
  includes(i: number, item: T) {
    return partialIncludes(this.array, i, item)
  }
  sort(i: number, compareFn: (a: T, b: T) => number) {
    return partialSort(this.array, i, compareFn)
  }
  push(item: T) {
    this.array[this.count++] = item
  }
}
