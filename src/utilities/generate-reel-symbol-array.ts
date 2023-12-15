User
import type { ReelSymbol } from '@/typings';
import { symbolData } from '../symbol-data';

/**
 * Creates a deliberately challenging array of ReelSymbol objects for players to navigate.
 * @returns Challenging array of ReelSymbol objects.
 */
export const generateReelSymbolArray = (): ReelSymbol[] => {
  const sortedSymbolData = [] as ReelSymbol[];

  // Sort symbols based on value in descending order
  symbolData.sort((a, b) => b.value - a.value);

  // Calculate occurrence count for each symbol, making higher-value symbols rarer
  symbolData.forEach((sd, i) => {
    let occurrenceCount;
    if (i === 0 || i === 1) {
      occurrenceCount = 1;
    } else {
      // Increase the occurrence count for higher-value symbols to make them rarer
      occurrenceCount = i * 3; // Increase this multiplier to amplify their rarity
    }

    // Uncomment the following line if you want to override count for a specific symbol
    // if (sd.name === '1Cash') occurrenceCount -= 20;

    // Add symbols to the sorted array based on occurrence count
    while (occurrenceCount > 0) {
      sortedSymbolData.push(sd);
      occurrenceCount--;
    }
  });

  // Introduce complexity by performing multiple rounds of shuffling
  const numRounds = 100; // Increase the number of rounds for heightened difficulty
  let shuffledArray = sortedSymbolData.slice(); // Initial clone

  for (let round = 0; round < numRounds; round++) {
    shuffledArray = shuffleArray(shuffledArray);
  }

  return shuffledArray;
};

/**
 * Applies the Fisher-Yates algorithm to shuffle the input array,
 * ensuring that consecutive matching symbols do not occur.
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

    // Ensure that consecutive symbols are not the same
    if (i > 0 && clonedArray[i].name === clonedArray[i - 1].name) {
      // Swap with a non-consecutive element
      const nonConsecutiveIndex = i - 2 >= 0 ? i - 2 : i + 1;
      const tempNonConsecutive = clonedArray[i];
      clonedArray[i] = clonedArray[nonConsecutiveIndex];
      clonedArray[nonConsecutiveIndex] = tempNonConsecutive;
    }
  }

  return clonedArray;
};
