import { $ } from 'signal'
import { partialSort } from 'utils'
import { FixedArray } from './fixed-array.ts'

export class SortableSet<T> implements Set<T> {
  set = new Set<T>()
  updated = 0
  _array = $(new FixedArray<T>())
  get array() {
    const { updated, _array } = this
    $()
    let i = 0
    for (const item of this) {
      _array.array[i++] = item
    }
    _array.count = i
    return _array
  }
  sort(compareFn: (a: T, b: T) => number) {
    partialSort(this.array.array, this.array.count, compareFn)
    return this.array
  }
  add(value: T) {
    this.set.add(value)
    this.updated++
    return this
  }
  clear() {
    this.set.clear()
    this.updated++
  }
  delete(value: T): boolean {
    const res = this.set.delete(value)
    this.updated++
    return res
  }
  forEach(callbackfn: (value: T, value2: T, set: Set<T>) => void, thisArg?: any): void {
    return this.set.forEach(callbackfn, thisArg)
  }
  has(value: T): boolean {
    return this.set.has(value)
  }
  get size() {
    this.updated
    return this.set.size
  }
  entries(): IterableIterator<[T, T]> {
    return this.set.entries()
  }
  keys(): IterableIterator<T> {
    return this.set.keys()
  }
  values(): IterableIterator<T> {
    return this.set.values()
  }
  [Symbol.iterator](): IterableIterator<T> {
    return this.set[Symbol.iterator]()
  }
  get [Symbol.toStringTag]() {
    return this.set[Symbol.toStringTag]
  }
}
