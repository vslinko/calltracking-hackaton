import { IEnhancedCall, IEnhancedOffer, IEnhancedClick } from '../enhance';
import { parseWords, relativeDistance, wordDistancies } from '../text';
import { IOfferAnalysis } from './index';
import { features } from '../config';

export async function analyseStreet(
  call: IEnhancedCall,
  offer: IEnhancedOffer,
  clicks: IEnhancedClick[],
  analysis: IOfferAnalysis,
): Promise<void> {
  const offerStreet = offer.geo.address.find(g => g.type === 'street');
  const offerLocation = offer.geo.address
    .filter(g => g.type === 'location')
    .pop();

  if (!offerStreet && !offerLocation) {
    return;
  }

  const streetWords = offerStreet
    ? parseWords(
        features.useFullNameForStreet
          ? features.removeStreetWordFromStreetFullName
            ? offerStreet.fullName.replace(/улиц\S+/, '')
            : offerStreet.fullName
          : offerStreet.name,
      )
    : [];

  const matches = (await wordDistancies(streetWords, call.normalizedWords))
    .map((matches, streetWordIndex) => {
      const streetWord = matches.word;
      return matches.matches.reduce<{
        distance: number;
        streetWord: string;
        streetWordIndex: number;
        word: string;
        wordIndex: number;
      }>((acc, match, wordIndex) => {
        const word = match.word;
        const distance = match.distance;

        if (distance > acc.distance) {
          acc.distance = distance;
          acc.word = word;
          acc.wordIndex = wordIndex;
        }

        return acc;
      }, {
        distance: 0,
        streetWord,
        streetWordIndex,
        word: '',
        wordIndex: -1,
      });
    })
    .sort((a, b) => b.distance - a.distance);

  let confidence = 0;

  if (matches.length > 0) {
    confidence = matches[0].distance;
    if (features.distanceFromStartToStreet) {
      confidence *= Math.cos(
        ((matches[0].wordIndex / call.normalizedWords.length) * Math.PI) / 2,
      );
    }

    if (
      features.tryToCalculateDistanceToSecondStreetWord &&
      matches.length > 1
    ) {
      const matchesDistance = Math.abs(
        matches[1].wordIndex - matches[0].wordIndex,
      );

      if (matchesDistance > 0 && matchesDistance < 5) {
        confidence += matches[1].distance * (1 / matchesDistance);
      }
    }
  }

  if (confidence <= features.tryToParseLocationAfterStreet && offerLocation) {
    const locationWords = offerLocation
      ? parseWords(
          features.useFullNameForLocation
            ? offerLocation.fullName
            : offerLocation.name,
        )
      : [];

    const matches = locationWords
      .map((streetWord, streetWordIndex) => {
        return call.normalizedWords.reduce(
          (acc, word, wordIndex) => {
            const distance = relativeDistance(streetWord, word);

            if (distance > acc.distance) {
              acc.distance = distance;
              acc.word = word;
              acc.wordIndex = wordIndex;
            }

            return acc;
          },
          {
            distance: 0,
            streetWord,
            streetWordIndex,
            word: '',
            wordIndex: -1,
          },
        );
      })
      .sort((a, b) => b.distance - a.distance);

    if (matches.length > 0) {
      let locationConfidence = matches[0].distance;

      if (features.distanceFromStartToStreet) {
        locationConfidence *= Math.cos(
          ((matches[0].wordIndex / call.normalizedWords.length) * Math.PI) / 2,
        );
      }

      if (locationConfidence > confidence) {
        analysis.street = {
          confidence,
          matches,
        };
        return;
      }
    }
  }

  analysis.street = {
    confidence,
    matches,
  };
}
