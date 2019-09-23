import { IEnhancedCall, IEnhancedOffer, IEnhancedClick } from '../enhance';
import { IOfferAnalysis } from './index';
import { relativeDistance } from '../text';
import { features } from '../config';

const wordsMapping: { [key: string]: string[] | undefined } = {
  Sale: ['купить', 'продать', 'покупка'],
  Rent: ['снять', 'аренда', 'арендовать'],
};

export function analyseDealType(
  call: IEnhancedCall,
  offer: IEnhancedOffer,
  clicks: IEnhancedClick[],
  analysis: IOfferAnalysis,
): void {
  const type = Object.keys(wordsMapping).find(key =>
    offer.category.endsWith(key),
  );

  if (!type) {
    return;
  }

  const words = wordsMapping[type];

  if (!words) {
    return;
  }

  const match = call.normalizedWords.reduce(
    (acc, word) => {
      return words.reduce((acc, roomWord, wordIndex) => {
        const distance = relativeDistance(roomWord, word);

        if (distance > acc.distance) {
          acc.distance = distance;
          acc.roomWord = roomWord;
          acc.word = word;
          acc.wordIndex = wordIndex;
        }

        return acc;
      }, acc);
    },
    { distance: 0, roomWord: '', word: '', wordIndex: -1 },
  );

  let confidence = match.distance;
  const distanceToStreet =
    features.distanceFromDealTypeToStreet && analysis.street
      ? Math.abs(match.wordIndex - analysis.street.matches[0].wordIndex)
      : null;

  if (distanceToStreet) {
    confidence *= 1 / distanceToStreet;
  }

  analysis.dealtype = {
    confidence,
    distanceToStreet,
    match,
  };
}
