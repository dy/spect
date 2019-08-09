// rendering engine is here


// aspect is identifyable by [$target, fn], a $target may have multiple aspects

// queue is a sequence of function to run after current frame
export let queue = []

// current aspect [$target, fx]
export let currentAspect

// [ $target, domain/effect: string, prop? ] : [...aspects] - aspects, assigned to observed data sources
export let observables = new Map

// set of changed observables [ target, prop ] for currentAspect call
export let currentDiff = null
