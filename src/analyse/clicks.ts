import { IEnhancedCall, IEnhancedOffer, IEnhancedClick } from '../enhance';
import { IOfferAnalysis } from './index';

export function analyseClicks(
  call: IEnhancedCall,
  offer: IEnhancedOffer,
  clicks: IEnhancedClick[],
  analysis: IOfferAnalysis,
): void {
  if (clicks.length === 0) {
    return;
  }

  const match = clicks
    .map(click => {
      return Math.abs(click.event_timestamp.diff(call.date).as('minutes'));
    })
    .sort((a, b) => a - b);

  const confidence = Math.max(0, 1 - match[0] / 10);

  analysis.clicks = {
    confidence,
  };
}
