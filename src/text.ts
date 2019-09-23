import * as levenshtein from 'fast-levenshtein';
import fetch from 'node-fetch';
import { features } from './config';

interface INormalizeResponse {
  result: {
    word: string;
    normalForm: string;
  }[];
}

export interface IDistanceMatch {
  word: string;
  distance: number;
}

export interface IDistanceMatches {
  word: string;
  matches: IDistanceMatch[];
}

interface ISoundexDistanceResponse {
  result: Array<{
    word: string;
    matches: Array<[string, number]>;
  }>;
}

export async function normalizeWords(words: string[]): Promise<string[]> {
  const res = await fetch('http://localhost:8080/normalize', {
    method: 'POST',
    body: JSON.stringify({
      words,
    }),
  });
  const data: INormalizeResponse = await res.json();
  return data.result.map(w => w.normalForm);
}

export function parseWords(str: string): string[] {
  return str
    .toLowerCase()
    .replace(/[^а-яё0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/ё/g, 'е')
    .trim()
    .split(' ')
    .reduce(
      (acc, w) => {
        acc.push(w);

        if (w.length > 5 && w.startsWith('на')) {
          acc.push(w.slice(2));
        }

        return acc;
      },
      [] as string[],
    );
}

export function parseNumbers(str: string): number[] {
  return str
    .replace(/[^\d ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(n => Number(n));
}

const endings = `
ого его ому ему ыми ими
ой ей ом ем ый ий ым им ая яя ую юю ое ее ые ие ых их
а я ы и е у ю о
`
  .trim()
  .split(/\s+/);

function convertDistanceToRelative(reference: string, input: string, distance: number): number {
  let relativeDistance =
    1 -
    Math.min(distance, reference.length) /
      reference.length;

  if (features.wordStartMatchCoefficient > 0) {
    const len = Math.min(reference.length, input.length);
    let i = 0;
    while (i < len) {
      if (reference[i] !== input[i]) {
        break;
      }
      i++;
    }
    const wordStartMatchPercent = (i + 1) / (len + 1);
    const wordStartMatchCoefficient =
      len >= features.wordStartMatchCoefficient ? wordStartMatchPercent : 0.5;

    relativeDistance *= wordStartMatchCoefficient;
  }

  if (features.wordSizeCoefficient > 0) {
    relativeDistance *= Math.min(1, reference.length / features.wordSizeCoefficient);
  }

  return relativeDistance;
}

export function relativeDistance(reference: string, input: string): number {
  if (
    features.wordRemoveEndings > 0 &&
    reference.length >= features.wordRemoveEndings &&
    input.length >= features.wordRemoveEndings
  ) {
    for (const ending of endings) {
      if (reference.endsWith(ending)) {
        reference = reference.slice(0, -ending.length);
        break;
      }
    }

    for (const ending of endings) {
      if (input.endsWith(ending)) {
        input = input.slice(0, -ending.length);
        break;
      }
    }
  }

  return convertDistanceToRelative(reference, input, levenshtein.get(reference, input));
}

export async function wordDistancies(
  needles: string[],
  haystack: string[],
): Promise<IDistanceMatches[]> {
  const res = await fetch('http://localhost:8080/soundex-distance', {
    method: 'POST',
    body: JSON.stringify({
      needles,
      haystack,
    }),
  });

  const data: ISoundexDistanceResponse = await res.json();

  return data.result.map(matches => {
    return {
      word: matches.word,
      matches: matches.matches.map((match) => {
        return {
          word: match[0],
          distance: convertDistanceToRelative(matches.word, match[0], match[1]),
        };
      }),
    };
  });
}
