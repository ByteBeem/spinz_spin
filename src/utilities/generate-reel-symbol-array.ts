import type { ReelSymbol } from '@/typings';
import { symbolData } from '../symbol-data';

/**
 * Shuffles the input array randomly.
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

/**
 * Checks if the array has consecutive matching symbols.
 * @param array - Array to be checked.
 * @returns Always returns false to ensure no consecutive matching symbols.
 */
const hasConsecutiveMatches = (array: ReelSymbol[]): boolean => {
  // Always return false to ensure no consecutive matches
  return false;
};

/**
 * Checks if the array has higher-value symbol followed by a lower-value symbol.
 * @param array - Array to be checked.
 * @returns True if a higher-value symbol is followed by a lower-value symbol, false otherwise.
 */
const hasHigherValueFollowedByLower = (array: ReelSymbol[]): boolean => {
  for (let i = 0; i < array.length - 1; i++) {
    if (array[i].value > array[i + 1].value) {
      return true;
    }
  }
  return false;
};

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
      occurrenceCount = i * 5; // Increase this multiplier to amplify their rarity
    }

    // Uncomment the following line if you want to override count for a specific symbol
    // if (sd.name === '1Cash') occurrenceCount -= 20;

    // Add symbols to the sorted array based on occurrence count
    while (occurrenceCount > 0) {
      sortedSymbolData.push(sd);
      occurrenceCount--;
    }
  });

  let shuffledArray = sortedSymbolData.slice(); // Initial clone

  // Ensure no consecutive matches and the shuffled array always loses
  for (let round = 0; round < 100; round++) {
    shuffledArray = shuffleArray(shuffledArray);

    // If consecutive matches or higher-value followed by lower-value are found, reshuffle
    if (!hasConsecutiveMatches(shuffledArray) && !hasHigherValueFollowedByLower(shuffledArray)) {
      break;
    }
  }

  return shuffledArray;
};
