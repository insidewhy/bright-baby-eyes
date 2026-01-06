export const empty = Symbol()
export type Empty = typeof empty

interface DoublyLinkedListEntry<K, V> {
  value: V | typeof empty
  key: K | typeof empty
  prev: DoublyLinkedListEntry<K, V> | undefined
  next: DoublyLinkedListEntry<K, V> | undefined
}

export class LRUCache<K, V> {
  #entryMap = new Map<K, DoublyLinkedListEntry<K, V>>()
  #priorityListHead: DoublyLinkedListEntry<K, V>
  #priorityListEnd: DoublyLinkedListEntry<K, V>

  constructor(capacity: number) {
    if (capacity < 1) throw new Error('Capacity must be a positive integer')

    // preallocate the priority list, this removes GC pressure during use
    this.#priorityListHead = { value: empty, key: empty, prev: undefined, next: undefined }
    let priorityListPtr = this.#priorityListHead
    for (let i = 1; i < capacity - 1; ++i) {
      priorityListPtr.next = { key: empty, value: empty, prev: priorityListPtr, next: undefined }
      priorityListPtr = priorityListPtr.next
    }

    if (capacity > 1) {
      this.#priorityListEnd = { key: empty, value: empty, prev: priorityListPtr, next: undefined }
      priorityListPtr.next = this.#priorityListEnd
    } else {
      this.#priorityListEnd = this.#priorityListHead
    }
  }

  private promoteToHeadOfPriorityList(listEntry: DoublyLinkedListEntry<K, V>): void {
    if (this.#priorityListHead === listEntry) return
    if (this.#priorityListEnd === listEntry) {
      this.#priorityListEnd = this.#priorityListEnd.prev!
    } else {
      // listEntry.next must be defined since it's not at the end of the queue
      listEntry.next!.prev = listEntry.prev
    }

    // listEntry.prev must be defined since it's not at the head of the queue
    listEntry.prev!.next = listEntry.next

    listEntry.prev = undefined
    listEntry.next = this.#priorityListHead

    this.#priorityListHead.prev = listEntry
    this.#priorityListHead = listEntry
  }

  get(key: K): V | Empty {
    const cacheEntry = this.#entryMap.get(key)
    if (!cacheEntry) return empty
    this.promoteToHeadOfPriorityList(cacheEntry)
    return cacheEntry.value
  }

  put(key: K, value: V): void {
    const cacheEntry = this.#entryMap.get(key)
    if (cacheEntry) {
      cacheEntry.value = value
      this.promoteToHeadOfPriorityList(cacheEntry)
      return
    }

    if (this.#priorityListEnd.key !== empty) this.#entryMap.delete(this.#priorityListEnd.key)

    const formerPriorityListEndPrev = this.#priorityListEnd.prev
    // avoid allocating a new object by overwriting properties in the final list element
    // then promoting it to the head
    this.#priorityListEnd.key = key
    this.#priorityListEnd.value = value
    this.#entryMap.set(key, this.#priorityListEnd)

    // it will be undefined when capacity is 1 (i.e. the head and the end are the same element)
    if (formerPriorityListEndPrev !== undefined) {
      this.#priorityListEnd.next = this.#priorityListHead
      this.#priorityListEnd.prev = undefined
      this.#priorityListHead.prev = this.#priorityListEnd
      this.#priorityListHead = this.#priorityListEnd
      this.#priorityListEnd = formerPriorityListEndPrev
      this.#priorityListEnd.next = undefined
    }
  }

  // For compatibility with Map
  set(key: K, value: V): LRUCache<K, V> {
    this.put(key, value)
    return this
  }

  delete(key: K): boolean {
    const cacheEntry = this.#entryMap.get(key)
    if (!cacheEntry) return false

    this.#entryMap.delete(key)

    if (cacheEntry !== this.#priorityListEnd) {
      if (cacheEntry === this.#priorityListHead) {
        this.#priorityListHead = this.#priorityListHead.next!
        this.#priorityListHead.prev = undefined
      } else {
        cacheEntry.next!.prev = cacheEntry.prev
        cacheEntry.prev!.next = cacheEntry.next
      }

      cacheEntry.prev = this.#priorityListEnd
      cacheEntry.next = undefined
      this.#priorityListEnd.next = cacheEntry
      this.#priorityListEnd = cacheEntry
    }

    cacheEntry.key = empty
    cacheEntry.value = empty

    return true
  }
}
