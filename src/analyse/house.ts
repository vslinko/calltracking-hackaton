import { IEnhancedCall, IEnhancedOffer, IEnhancedClick } from '../enhance';
import { IOfferAnalysis } from './index';
import { features } from '../config';

export function analyseHouse(
  call: IEnhancedCall,
  offer: IEnhancedOffer,
  clicks: IEnhancedClick[],
  analysis: IOfferAnalysis,
): void {
  if (!analysis.street || analysis.street.matches.length === 0) {
    return;
  }

  const streetAnalysis = analysis.street;

  const offerHouse = offer.geo.address.find(g => g.type === 'house');

  if (!offerHouse) {
    return;
  }

  const matches = /(\d+)/.exec(offerHouse.name);

  if (!matches) {
    return;
  }

  const houseNumber = Number(matches[1]);

  const match = call.normalizedWords.reduce(
    (acc, word, wordIndex) => {
      const matches = /(\d+)/.exec(word);

      if (!matches) {
        return acc;
      }

      const num = Number(matches[1]);
      let distanceToStreet = 1;

      let score =
        features.houseError > 0
          ? Math.max(0, 1 - Math.abs(num - houseNumber) / features.houseError)
          : num === houseNumber
          ? 1
          : 0;

      if (features.distanceFromHouseToStreet) {
        distanceToStreet = Math.abs(
          wordIndex - streetAnalysis.matches[0].wordIndex,
        );
        score *= 1 / Math.max(1, distanceToStreet);
      }

      if (score > acc.score) {
        acc.score = score;
        acc.number = num;
        acc.wordIndex = wordIndex;
        acc.distanceToStreet = distanceToStreet;
      }

      return acc;
    },
    { score: 0, number: 0, wordIndex: -1, distanceToStreet: 0 },
  );

  if (match.wordIndex >= 0) {
    analysis.house = {
      confidence: match.score,
      houseNumber,
      match,
    };
  }
}
