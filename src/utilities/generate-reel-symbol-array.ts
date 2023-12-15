import type { ReelSymbol } from '@/typings';
import { symbolData } from '../symbol-data';

/**
 * Creates an array of ReelSymbol objects for players with only non-matching symbols.
 * @returns Array of ReelSymbol objects.
 */
export const generateReelSymbolArray = (): ReelSymbol[] => {
  const uniqueSymbolData = Array.from(new Set(symbolData));
  const shuffledArray = shuffleArray(uniqueSymbolData);
  return shuffledArray;
};

/**
 * Applies the Fisher-Yates algorithm to shuffle the input array.
 * @param array - Array to be shuffled.
 * @returns Shuffled array.
 */
const shuffleArray = (array: ReelSymbol[]): ReelSymbol[] => {
  const clonedArray = [...array]; // Clone the array
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // Swap elements randomly to enhance unpredictability
    const temp = clonedArray[i];
    clonedArray[i] = clonedArray[j];
    clonedArray[j] = temp;
  }
  return clonedArray;
};
