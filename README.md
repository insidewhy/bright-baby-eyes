# Bright Baby Eyes

A high-performance LRU (Least Recently Used) cache implementation in TypeScript using a doubly-linked list for O(1) operations.

## What is this?

Bright Baby Eyes is an efficient LRU cache that maintains a fixed-size collection of key-value pairs. When the cache reaches capacity, the least recently used item is automatically evicted to make room for new entries.

## Why use this?

Most "simple" LRU cache implementations using JavaScript's `Map` rely on insertion order and must perform expensive delete+reinsert operations on every cache access. This implementation uses a doubly-linked list to track recency, providing true O(1) time complexity for both reads and writes.

### Performance Comparison

Benchmarked against a naive Map-based implementation (which deletes and reinserts entries to maintain order):

| Scenario                  | LinkedList Time | Naive Map Time | Speedup           |
| ------------------------- | --------------- | -------------- | ----------------- |
| Sequential Inserts        | 21.76ms         | 27.95ms        | **1.28x faster**  |
| Random Access             | 4.34ms          | 7.03ms         | **1.62x faster**  |
| Mixed Workload            | 5.86ms          | 12.91ms        | **2.20x faster**  |
| High Hit Rate             | 4.34ms          | 7.13ms         | **1.64x faster**  |
| Large Cache (10k entries) | 11.55ms         | 278.61ms       | **24.13x faster** |

**Average speedup: 4.71x** across realistic workloads.

The performance gap grows dramatically with cache size, making this implementation essential for production use cases.

## Installation

```bash
# Using npm
npm install bright-baby-eyes

# Using pnpm
pnpm add bright-baby-eyes

# Using yarn
yarn add bright-baby-eyes

# Using deno
import { LRUCache, empty } from "https://deno.land/x/bright_baby_eyes/index.ts"
```

## Usage

```typescript
import { LRUCache, empty } from 'bright-baby-eyes'

const cache = new LRUCache<string, number>(3)

cache.put('a', 1)
cache.put('b', 2)
cache.put('c', 3)

console.log(cache.get('a')) // 1
console.log(cache.get('b')) // 2

cache.put('d', 4)

console.log(cache.get('c')) // empty (evicted as least recently used)
console.log(cache.get('d')) // 4
```

### Checking for cache misses

```typescript
import { LRUCache, empty } from 'bright-baby-eyes'

const cache = new LRUCache<string, User>(100)

const user = cache.get('user:123')

if (user === empty) {
  const freshUser = await fetchUserFromDatabase('123')
  cache.put('user:123', freshUser)
}
```

## API

### `new LRUCache<K, V>(capacity: number)`

Creates a new LRU cache with the specified capacity.

**Parameters:**

- `capacity`: Maximum number of entries the cache can hold (must be ≥ 1)

**Throws:**

- Error if capacity < 1

### `cache.get(key: K): V | Empty`

Retrieves a value from the cache and marks it as recently used.

**Returns:**

- The cached value if the key exists
- `empty` symbol if the key doesn't exist

**Time Complexity:** O(1)

### `cache.put(key: K, value: V): void`

Inserts or updates a key-value pair in the cache. If the cache is at capacity, evicts the least recently used entry.

**Time Complexity:** O(1)

### `cache.set(key: K, value: V): LRUCache<K, V>`

The same as `cache.put` but returns `cache` allowing calls to be chained:

```typescript
cache.set(1, 2).set(3, 4)
```

### `cache.delete(key: K): boolean`

Remove a key-value pair from the cache if it exists and returns `true`, otherwise returns `false`.

**Time Complexity:** O(1)

### `empty` Symbol

A unique symbol exported by the library to distinguish cache misses from `undefined` values.

```typescript
import { empty } from 'bright-baby-eyes'

// You can cache undefined values
cache.put('key', undefined)
console.log(cache.get('key')) // undefined

// Cache misses return the empty symbol
console.log(cache.get('nonexistent')) // empty
```

## How it works

### Architecture

The implementation combines two data structures:

1. **Hash Map** (`Map<K, DoublyLinkedListEntry<K, V>>`): Provides O(1) key lookups
2. **Doubly-Linked List**: Maintains access order with O(1) reordering

### Why it's faster than naive approaches

A naive implementation using JavaScript's `Map` might look like this:

```typescript
class NaiveLRUCache<K, V> {
  private cache = new Map<K, V>()

  get(key: K): V | undefined {
    const value = this.cache.get(key)
    if (value !== undefined) {
      this.cache.delete(key)
      this.cache.set(key, value)
    }
    return value
  }

  put(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    } else if (this.cache.size >= this.capacity) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    this.cache.set(key, value)
  }
}
```

This approach has several performance problems:

1. **Every read requires a delete + reinsert**: To move an accessed item to the end of the Map, you must remove it and re-add it
2. **Iterator allocation overhead**: `cache.keys().next().value` creates an iterator object on every eviction
3. **Poor scaling**: As the Map grows, the cost of these operations increases

In contrast, the doubly-linked list approach:

1. **True O(1) reordering**: Simply updates 4-6 pointers to move a node to the head
2. **No allocations**: Reuses pre-allocated list nodes
3. **Constant time regardless of cache size**: Performance remains flat even with 10,000+ entries

### Memory efficiency

The cache pre-allocates all linked list nodes during construction, ensuring:

- No allocations during normal operation
- Predictable memory usage
- Better cache locality for the CPU

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.
