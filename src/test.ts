import { Pool } from 'pg';
import { readRasmetka, getRasmetkaCalls } from './input';
import { enhanceCase } from './enhance';
import { analyseCase } from './analyse/index';
import { Bar } from 'cli-progress';
import * as fs from 'fs';
import { features, weights, limits } from './config';

async function main() {
  try {
    const pool = new Pool();
    const stat = {
      good: [] as number[],
      badMatch: [] as number[],
      badMarkup: [] as number[],
      get goodL() {
        return this.good.length;
      },
      get badMatchL() {
        return this.badMatch.length;
      },
      get badMarkupL() {
        return this.badMarkup.length;
      },
      get total() {
        return this.goodL + this.badMatchL + this.badMarkupL;
      },
      get rank() {
        return ((this.goodL / this.total) * 100).toFixed(2) + '%';
      },
      get goodRank() {
        return (
          ((this.goodL / (this.goodL + this.badMatchL)) * 100).toFixed(2) + '%'
        );
      },
    };

    const bar = new Bar({
      format:
        'working |{bar}| {value}/{total} ({percentage}%) | ETA: {eta}s | Rank: {rank} | Last error: {lastError}',
    });
    const ids = await getRasmetkaCalls(pool);
    bar.start(ids.length, 0, {
      rank: '100%',
      lastError: '-',
    });

    for await (const inputCase of readRasmetka(pool, ids)) {
      const enhancedCase = await enhanceCase(inputCase);
      const analysedCase = analyseCase(enhancedCase);

      const bestMatch =
        analysedCase.offersAnalyses.length > 0
          ? analysedCase.offersAnalyses[0].realtyid
          : null;

      const markupMatch = analysedCase.markup
        ? analysedCase.markup.realtyid
        : null;

      if (!markupMatch) {
        stat.badMarkup.push(analysedCase.call.calltrackingid);
      } else if (bestMatch === markupMatch) {
        stat.good.push(analysedCase.call.calltrackingid);
      } else {
        stat.badMatch.push(analysedCase.call.calltrackingid);
      }

      bar.increment(1, {
        rank: stat.rank,
        lastError: stat.badMatch.slice(-1)[0] || '-',
      });
    }

    bar.stop();

    const log = fs.createWriteStream('logs/runs.log', {
      flags: 'a',
    });
    log.write(
      JSON.stringify(
        {
          features,
          weights,
          limits,
          goodRank: stat.goodRank,
          badMatch: stat.badMatch,
        },
        null,
        2,
      ) + '\n',
    );
    log.end();
    console.log(stat.goodRank);
    console.log(stat.badMatch.join(' '));

    await pool.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
