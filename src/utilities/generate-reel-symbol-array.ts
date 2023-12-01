import type { ReelSymbol } from '@/typings';
import { symbolData } from '../symbol-data';

/**
 * Generates a shuffled array of ReelSymbol objects.
 * @returns Shuffled array of ReelSymbol objects.
 */
export const generateReelSymbolArray = (): ReelSymbol[] => {
  const sortedSymbolData = [] as ReelSymbol[];

  // Sort symbols based on value
  symbolData.sort((a, b) => b.value - a.value);

  // Calculate occurrence count for each symbol
  symbolData.forEach((sd, i) => {
    let occurrenceCount;
    if (i === 0 || i === 1) {
      occurrenceCount = 1;
    } else {
      // Increase the occurrence count for higher-value symbols to make them rarer
      occurrenceCount = i * 3; // Increase this multiplier to make them even rarer
    }

    // Uncomment the following line if you want to override count for a specific symbol
    // if (sd.name === '1Cash') occurrenceCount -= 20;

    // Add symbols to the sorted array based on occurrence count
    while (occurrenceCount > 0) {
      sortedSymbolData.push(sd);
      occurrenceCount--;
    }
  });

  // Perform multiple rounds of shuffling
  const numRounds = 20; // Adjust the number of rounds based on desired difficulty
  let shuffledArray = sortedSymbolData.slice(); // Initial clone

  for (let round = 0; round < numRounds; round++) {
    shuffledArray = shuffleArray(shuffledArray);
  }

  return shuffledArray;
};

/**
 * Shuffles the input array using the Fisher-Yates algorithm.
 * @param array - Array to be shuffled.
 * @returns Shuffled array.
 */
const shuffleArray = (array: ReelSymbol[]): ReelSymbol[] => {
  const clonedArray = [...array]; // Clone
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = clonedArray[i];
    clonedArray[i] = clonedArray[j];
    clonedArray[j] = temp;
  }
  return clonedArray;
};
