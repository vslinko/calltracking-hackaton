import {
  IEnhancedCall,
  IEnhancedOffer,
  IEnhancedClick,
  IEnhancedCase,
} from '../enhance';
import { analyseStreet } from './street';
import { analyseHouse } from './house';
import { analyseRooms } from './rooms';
import { analyseOfferType } from './offertype';
import { weights, limits, features } from '../config';
import { analyseClicks } from './clicks';
import { analyseDealType } from './dealtype';
import { analyseCreated } from './created';

export interface IOfferAnalysis {
  realtyid: number;
  score: number;
  matched_by_phone: boolean;
  daysFromCreationToCall?: {
    confidence: number;
    days: number;
  };
  street?: {
    confidence: number;
    matches: {
      distance: number;
      streetWord: string;
      streetWordIndex: number;
      word: string;
      wordIndex: number;
    }[];
  };
  house?: {
    confidence: number;
    houseNumber: number;
    match: {
      score: number;
      number: number;
      wordIndex: number;
      distanceToStreet: number;
    };
  };
  dealtype?: {
    confidence: number;
    distanceToStreet: number | null;
    match: {
      distance: number;
      roomWord: string;
      word: string;
      wordIndex: number;
    };
  };
  offertype?: {
    confidence: number;
    distanceToStreet: number | null;
    match: {
      distance: number;
      roomWord: string;
      word: string;
      wordIndex: number;
    };
  };
  roomscount?: {
    confidence: number;
    distanceToStreet: number | null;
    match: {
      distance: number;
      roomWord: string;
      word: string;
      wordIndex: number;
    };
  };
  clicks?: {
    confidence: number;
  };
}

export interface IAnalisedCase extends IEnhancedCase {
  offersAnalyses: IOfferAnalysis[];
}

async function analyseOffer(
  call: IEnhancedCall,
  offer: IEnhancedOffer,
  clicks: IEnhancedClick[],
): Promise<IOfferAnalysis> {
  const analysis: IOfferAnalysis = {
    realtyid: offer.realtyid,
    matched_by_phone: offer.matched_by_phone,
    score: 0,
  };

  await analyseStreet(call, offer, clicks, analysis);
  analyseHouse(call, offer, clicks, analysis);
  analyseDealType(call, offer, clicks, analysis);
  analyseOfferType(call, offer, clicks, analysis);
  analyseRooms(call, offer, clicks, analysis);
  analyseClicks(call, offer, clicks, analysis);
  analyseCreated(call, offer, clicks, analysis);

  return analysis;
}

type AnalysisType =
  | 'street'
  | 'house'
  | 'dealtype'
  | 'offertype'
  | 'roomscount'
  | 'clicks'
  | 'daysFromCreationToCall';

function scoreOffers(offersAnalyses: IOfferAnalysis[]): void {
  offersAnalyses.forEach(analysis => {
    function read(type: AnalysisType): number {
      const part = analysis[type];
      if (!part) {
        return 0;
      }
      const confidence = part.confidence;
      if (confidence < limits[type]) {
        return 0;
      }
      return confidence * weights[type];
    }

    if (features.strictMatchByPhone && !analysis.matched_by_phone) {
      analysis.score = 0;
      return;
    }

    analysis.score = [
      read('street'),
      read('house'),
      read('dealtype'),
      read('offertype'),
      read('roomscount'),
      read('clicks'),
      features.includeMatchedByPhone > 0
        ? analysis.matched_by_phone
          ? features.includeMatchedByPhone
          : 0
        : 0,
      read('daysFromCreationToCall'),
    ].reduce((acc, c) => acc + c, 0);
  });

  offersAnalyses.sort((a, b) => b.score - a.score);
}

export async function analyseCase(input: IEnhancedCase): Promise<IAnalisedCase> {
  const offersAnalyses = await Promise.all(input.offers.map(offer => {
    const clicks = input.clicks.filter(c => c.realtyid === offer.realtyid);
    return analyseOffer(input.call, offer, clicks);
  }));

  scoreOffers(offersAnalyses);

  return {
    ...input,
    offersAnalyses,
  };
}
