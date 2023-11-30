import type { ReelSymbol } from './typings'

// Watermarked preview images from https://cdn4.iconfinder.com/data/icons/slot-machines<512/Lemon-512.png>
export const symbolData = [
  {
    name: 'Lemon',
    value: 10,
    image: '/symbol-images/Lemon-512.webp'
  },
  {
    name: 'Melon',
    value: 60,
    image: '/symbol-images/Watermelon-512.webp'
  },
  {
    name: 'Bananna',
    value: 30,
    image: '/symbol-images/Bananas-512.webp'
  },
  {
    name: 'Grapes',
    value: 35,
    image: '/symbol-images/Grapes-512.webp'
  },
  {
    name: 'Cherry',
    value: 40,
    image: '/symbol-images/Cherry-512.webp'
  },
  {
    name: 'Clover',
    value: 100,
    image: '/symbol-images/Clover-512.webp'
  },
  {
    name: 'Crown',
    value: 158,
    image: '/symbol-images/Crown-512.webp'
  },
  {
    name: 'Cash',
    value: 350,
    image: '/symbol-images/Dollars-512.webp'
  }
] as ReelSymbol[]

// For determining wins and rendering WinLegend.vue
export const cashSymbolData = [
  {
    name: '2Cash',
    value: 75,
    number: 2,
    image: '/symbol-images/Dollars-512.webp'
  },
  {
    name: '1Cash',
    value: 15,
    number: 1,
    image: '/symbol-images/Dollars-512.webp'
  }
] as ReelSymbol[]
