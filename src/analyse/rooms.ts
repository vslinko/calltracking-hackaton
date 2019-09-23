import { IEnhancedCall, IEnhancedOffer, IEnhancedClick } from '../enhance';
import { IOfferAnalysis } from './index';
import { relativeDistance } from '../text';
import { features } from '../config';

const wordsMapping: { [key: string]: string[] | undefined } = {
  1: ['однушка', 'однокомнатная'],
  2: ['двушка', 'двухкомнатная'],
  3: ['трешка', 'трехкомнатная'],
  4: ['четырехкомнатная'],
  5: ['пятикомнатная', 'пятикомнатная'],
  6: ['шестикомнатная', 'шестикомнатная'],
};

export function analyseRooms(
  call: IEnhancedCall,
  offer: IEnhancedOffer,
  clicks: IEnhancedClick[],
  analysis: IOfferAnalysis,
): void {
  const words = wordsMapping[offer.roomscount];

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
    features.distanceFromRoomsToStreet && analysis.street
      ? Math.abs(match.wordIndex - analysis.street.matches[0].wordIndex)
      : null;

  if (distanceToStreet) {
    confidence *= 1 / distanceToStreet;
  }

  analysis.roomscount = {
    confidence,
    distanceToStreet,
    match,
  };
}
