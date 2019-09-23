import { IEnhancedCall, IEnhancedOffer, IEnhancedClick } from '../enhance';
import { IOfferAnalysis } from './index';

export function analyseCreated(
  call: IEnhancedCall,
  offer: IEnhancedOffer,
  clicks: IEnhancedClick[],
  analysis: IOfferAnalysis,
): void {
  const days = Math.abs(offer.creationdate.diff(call.date).as('days'));
  const confidence = 1 / days;

  analysis.daysFromCreationToCall = {
    confidence,
    days,
  };
}
