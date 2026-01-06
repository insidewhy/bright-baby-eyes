import { describe, it, expect } from 'vitest'
import { LRUCache, empty } from './index'

describe('LRUCache', () => {
  describe('constructor', () => {
    it('creates a cache with the specified capacity', () => {
      const cache = new LRUCache<string, number>(5)
      expect(cache).toBeInstanceOf(LRUCache)
    })

    it('throws an error for capacity < 1', () => {
      expect(() => new LRUCache<string, number>(0)).toThrow('Capacity must be a positive integer')
      expect(() => new LRUCache<string, number>(-1)).toThrow('Capacity must be a positive integer')
    })

    it('accepts capacity of 1', () => {
      expect(() => new LRUCache<string, number>(1)).not.toThrow()
    })
  })

  describe('get', () => {
    it('returns empty for non-existent keys', () => {
      const cache = new LRUCache<string, number>(3)
      expect(cache.get('nonexistent')).toBe(empty)
    })

    it('returns the cached value for existing keys', () => {
      const cache = new LRUCache<string, number>(3)
      cache.put('key', 42)
      expect(cache.get('key')).toBe(42)
    })

    it('can cache undefined values', () => {
      const cache = new LRUCache<string, undefined>(3)
      cache.put('key', undefined)
      expect(cache.get('key')).toBe(undefined)
    })

    it('distinguishes between undefined values and cache misses', () => {
      const cache = new LRUCache<string, undefined>(3)
      cache.put('key', undefined)
      expect(cache.get('key')).toBe(undefined)
      expect(cache.get('missing')).toBe(empty)
      expect(cache.get('key')).not.toBe(empty)
    })

    it('promotes accessed items to most recently used', () => {
      const cache = new LRUCache<string, number>(3)
      cache.put('a', 1)
      cache.put('b', 2)
      cache.put('c', 3)

      cache.get('a')

      cache.put('d', 4)

      expect(cache.get('a')).toBe(1)
      expect(cache.get('b')).toBe(empty)
    })
  })

  describe('put', () => {
    it('stores a key-value pair', () => {
      const cache = new LRUCache<string, number>(3)
      cache.put('key', 42)
      expect(cache.get('key')).toBe(42)
    })

    it('updates existing keys', () => {
      const cache = new LRUCache<string, number>(3)
      cache.put('key', 42)
      cache.put('key', 100)
      expect(cache.get('key')).toBe(100)
    })

    it('evicts the least recently used item when at capacity', () => {
      const cache = new LRUCache<string, number>(3)
      cache.put('a', 1)
      cache.put('b', 2)
      cache.put('c', 3)
      cache.put('d', 4)

      expect(cache.get('a')).toBe(empty)
      expect(cache.get('b')).toBe(2)
      expect(cache.get('c')).toBe(3)
      expect(cache.get('d')).toBe(4)
    })

    it('promotes updated keys to most recently used', () => {
      const cache = new LRUCache<string, number>(3)
      cache.put('a', 1)
      cache.put('b', 2)
      cache.put('c', 3)

      cache.put('a', 10)

      cache.put('d', 4)

      expect(cache.get('a')).toBe(10)
      expect(cache.get('b')).toBe(empty)
      expect(cache.get('c')).toBe(3)
      expect(cache.get('d')).toBe(4)
    })
  })

  describe('delete', () => {
    it('returns false when deleting non-existent key', () => {
      const cache = new LRUCache<string, number>(3)
      expect(cache.delete('nonexistent')).toBe(false)
    })

    it('returns true when deleting existing key', () => {
      const cache = new LRUCache<string, number>(3)
      cache.put('key', 42)
      expect(cache.delete('key')).toBe(true)
    })

    it('makes deleted key unavailable', () => {
      const cache = new LRUCache<string, number>(3)
      cache.put('key', 42)
      cache.delete('key')
      expect(cache.get('key')).toBe(empty)
    })

    it('deletes value at the head of the queue', () => {
      const cache = new LRUCache<string, number>(3)
      cache.put('a', 1)
      cache.put('b', 2)
      cache.put('c', 3)

      expect(cache.delete('c')).toBe(true)
      expect(cache.get('c')).toBe(empty)
      expect(cache.get('a')).toBe(1)
      expect(cache.get('b')).toBe(2)
    })

    it('deletes value at the tail of the queue', () => {
      const cache = new LRUCache<string, number>(3)
      cache.put('a', 1)
      cache.put('b', 2)
      cache.put('c', 3)

      expect(cache.delete('a')).toBe(true)
      expect(cache.get('a')).toBe(empty)
      expect(cache.get('b')).toBe(2)
      expect(cache.get('c')).toBe(3)
    })

    it('deletes value in the middle of the queue', () => {
      const cache = new LRUCache<string, number>(3)
      cache.put('a', 1)
      cache.put('b', 2)
      cache.put('c', 3)

      expect(cache.delete('b')).toBe(true)
      expect(cache.get('b')).toBe(empty)
      expect(cache.get('a')).toBe(1)
      expect(cache.get('c')).toBe(3)
    })

    it('works with cache of size 1', () => {
      const cache = new LRUCache<string, number>(1)
      cache.put('a', 1)
      expect(cache.delete('a')).toBe(true)
      expect(cache.get('a')).toBe(empty)
    })

    it('allows new values to be added after deletion in size 1 cache', () => {
      const cache = new LRUCache<string, number>(1)
      cache.put('a', 1)
      cache.delete('a')
      cache.put('b', 2)
      expect(cache.get('a')).toBe(empty)
      expect(cache.get('b')).toBe(2)
    })

    it('increases available capacity after deletion', () => {
      const cache = new LRUCache<string, number>(3)
      cache.put('a', 1)
      cache.put('b', 2)
      cache.put('c', 3)

      cache.delete('a')

      cache.put('d', 4)
      cache.put('e', 5)

      expect(cache.get('b')).toBe(empty)
      expect(cache.get('c')).toBe(3)
      expect(cache.get('d')).toBe(4)
      expect(cache.get('e')).toBe(5)
    })

    it('handles deletion followed by eviction', () => {
      const cache = new LRUCache<string, number>(3)
      cache.put('a', 1)
      cache.put('b', 2)
      cache.put('c', 3)

      cache.delete('b')

      cache.put('d', 4)
      cache.put('e', 5)
      cache.put('f', 6)

      expect(cache.get('a')).toBe(empty)
      expect(cache.get('b')).toBe(empty)
      expect(cache.get('c')).toBe(empty)
      expect(cache.get('d')).toBe(4)
      expect(cache.get('e')).toBe(5)
      expect(cache.get('f')).toBe(6)
    })

    it('handles multiple deletions', () => {
      const cache = new LRUCache<string, number>(5)
      cache.put('a', 1)
      cache.put('b', 2)
      cache.put('c', 3)
      cache.put('d', 4)
      cache.put('e', 5)

      cache.delete('b')
      cache.delete('d')

      expect(cache.get('a')).toBe(1)
      expect(cache.get('b')).toBe(empty)
      expect(cache.get('c')).toBe(3)
      expect(cache.get('d')).toBe(empty)
      expect(cache.get('e')).toBe(5)
    })
  })

  describe('capacity edge cases', () => {
    it('works with capacity of 1', () => {
      const cache = new LRUCache<string, number>(1)
      cache.put('a', 1)
      expect(cache.get('a')).toBe(1)

      cache.put('b', 2)
      expect(cache.get('a')).toBe(empty)
      expect(cache.get('b')).toBe(2)
    })

    it('works with capacity of 2', () => {
      const cache = new LRUCache<string, number>(2)
      cache.put('a', 1)
      cache.put('b', 2)

      expect(cache.get('a')).toBe(1)
      expect(cache.get('b')).toBe(2)

      cache.put('c', 3)
      expect(cache.get('a')).toBe(empty)
      expect(cache.get('b')).toBe(2)
      expect(cache.get('c')).toBe(3)
    })

    it('handles large capacities', () => {
      const cache = new LRUCache<number, string>(10000)

      for (let i = 0; i < 10000; i++) {
        cache.put(i, `value${i}`)
      }

      for (let i = 0; i < 10000; i++) {
        expect(cache.get(i)).toBe(`value${i}`)
      }

      cache.put(10000, 'value10000')
      expect(cache.get(0)).toBe(empty)
      expect(cache.get(10000)).toBe('value10000')
    })
  })

  describe('complex scenarios', () => {
    it('maintains correct LRU order with mixed operations', () => {
      const cache = new LRUCache<string, number>(4)

      cache.put('a', 1)
      cache.put('b', 2)
      cache.put('c', 3)
      cache.put('d', 4)

      cache.get('b')
      cache.get('a')

      cache.put('e', 5)

      expect(cache.get('c')).toBe(empty)
      expect(cache.get('d')).toBe(4)
      expect(cache.get('b')).toBe(2)
      expect(cache.get('a')).toBe(1)
      expect(cache.get('e')).toBe(5)
    })

    it('handles repeated gets of the same key', () => {
      const cache = new LRUCache<string, number>(3)
      cache.put('a', 1)
      cache.put('b', 2)
      cache.put('c', 3)

      cache.get('a')
      cache.get('a')
      cache.get('a')

      cache.put('d', 4)

      expect(cache.get('a')).toBe(1)
      expect(cache.get('b')).toBe(empty)
    })

    it('handles repeated puts of the same key', () => {
      const cache = new LRUCache<string, number>(3)
      cache.put('a', 1)
      cache.put('b', 2)
      cache.put('c', 3)

      cache.put('a', 10)
      cache.put('a', 11)
      cache.put('a', 12)

      cache.put('d', 4)

      expect(cache.get('a')).toBe(12)
      expect(cache.get('b')).toBe(empty)
    })

    it('works with complex object keys', () => {
      const cache = new LRUCache<object, string>(3)
      const key1 = { id: 1 }
      const key2 = { id: 2 }
      const key3 = { id: 3 }

      cache.put(key1, 'value1')
      cache.put(key2, 'value2')
      cache.put(key3, 'value3')

      expect(cache.get(key1)).toBe('value1')
      expect(cache.get(key2)).toBe('value2')
      expect(cache.get(key3)).toBe('value3')
      expect(cache.get({ id: 1 })).toBe(empty)
    })

    it('works with complex object values', () => {
      interface User {
        name: string
        age: number
      }

      const cache = new LRUCache<string, User>(3)
      const user1 = { name: 'Alice', age: 30 }
      const user2 = { name: 'Bob', age: 25 }

      cache.put('user1', user1)
      cache.put('user2', user2)

      expect(cache.get('user1')).toBe(user1)
      expect(cache.get('user2')).toBe(user2)
    })
  })

  describe('type safety', () => {
    it('enforces type constraints on keys and values', () => {
      const cache = new LRUCache<string, number>(3)

      cache.put('key', 42)
      const value = cache.get('key')

      if (value !== empty) {
        const num: number = value
        expect(num).toBe(42)
      }
    })
  })
})
