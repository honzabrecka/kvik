

const rt_fmap = (f, context) => new RoseTree(
  f(context.root),
  () => context.children().map((child) => rt_fmap(f, child))
)

class RoseTree {

  constructor(root, children) {
    this.root = root
    this.children = children
  }

  map(f) {
    return rt_fmap(f, this)
  }

}

const engine = random.engines.mt19937()
engine.seed(9)

const rng = (min, max) => random.integer(min, max)(engine)

function shrinkFailing(tree, prop) {
  function* s() {
    let children = tree.children()
    let i = 0
    let result
    let child

    while (i < children.length) {
      child = children[i]
      result = prop(child.root)// memoize

      if (result) {
        i++
      } else {
        i = 0
        children = child.children()
      }

      yield [result, child]
    }
  }

  return reduce(
    ([reduced, [lastFailingNode, attempts, shrinks]], [result, node]) =>
      [reduced, [
        result ? lastFailingNode : node,
        attempts + 1,
        shrinks + (result ? 0 : 1)
      ]],
    [tree, 0, 0]
  )(s())
}

const forAll = (gen, prop, count = 100) => transduce(
  comp(
    map((sample) => [prop(sample.root), sample]),
    map(([result, sample]) => [result, result ? sample : shrinkFailing(sample, prop)]),
    takeWhile(([result, _]) => result === true, true)
  ),
  ([prevResult, _], [currentResult, sample]) => [prevResult && currentResult, sample],
  [true, null],
  sample(rng, gen, count)
)

module.exports = {
  range,
  map,
  filter,
  take,
  takeWhile,
  transduce,
  comp,
  conj,
  tap,
  identity,
  complement,
  even,
  odd,
  sum,
  inc,
  intoArray,
  dorun,
  gen,
  sample,
  shrink,
  shrinkFailing,
  forAll,
  roundTowardZero,
  toRoseTrees,
  RoseTree,
}
