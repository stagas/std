export const enum TraverseOp {
  Item,
  Enter,
  Leave
}

interface It {
  [key: string]: Component
}

interface Component {
  its?: Its
}

type Its = It[]

export function* traverse<T extends Its>(prop: string, its: T): Generator<[op: TraverseOp, it: T]> {
  for (const it of its) {
    const r = it[prop]
    if (r.its) {
      yield [TraverseOp.Enter, it] as any
      yield* traverse(prop, r.its as any)
      yield [TraverseOp.Leave, it] as any
    }
    yield [TraverseOp.Item, it] as any
  }
}
