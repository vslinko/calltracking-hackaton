import { Pool } from 'pg';
import { readInput } from './input';
import { enhanceCase } from './enhance';
import { analyseCase } from './analyse/index';

async function main() {
  try {
    const pool = new Pool();

    console.log('calltrackingid,realtyid');

    for await (const inputCase of readInput(pool)) {
      const enhancedCase = await enhanceCase(inputCase);
      const analysedCase = await analyseCase(enhancedCase);

      const bestMatch =
        analysedCase.offersAnalyses.length > 0
          ? analysedCase.offersAnalyses[0].realtyid
          : null;

      console.log(`${analysedCase.call.calltrackingid},${bestMatch}`);
    }

    await pool.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
