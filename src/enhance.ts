import { IInputCall, IInputClick, IInputOffer, IInputCase } from './input';
import { normalizeWords, parseWords } from './text';

export interface IEnhancedCall extends IInputCall {
  words: string[];
  normalizedWords: string[];
}

export interface IEnhancedClick extends IInputClick {}

export interface IEnhancedOffer extends IInputOffer {}

export interface IEnhancedCase extends IInputCase {
  call: IEnhancedCall;
  offers: IEnhancedOffer[];
  clicks: IEnhancedClick[];
}

async function enhanceCall(call: IInputCall): Promise<IEnhancedCall> {
  const words = parseWords(call.text);
  const normalizedWords = await normalizeWords(words);

  return {
    ...call,
    words,
    normalizedWords,
  };
}

export async function enhanceCase(input: IInputCase): Promise<IEnhancedCase> {
  const call = await enhanceCall(input.call);

  return {
    call,
    offers: input.offers,
    clicks: input.clicks,
    markup: input.markup,
  };
}
