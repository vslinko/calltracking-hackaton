import { Pool, QueryResult } from 'pg';
import * as fs from 'fs';

const log = fs.createWriteStream('logs/sql.log', {
  flags: 'w',
});

export async function execQuery(
  client: Pool,
  query: string,
  params?: any[] | undefined,
): Promise<QueryResult<any>> {
  log.write(query + '\n' + JSON.stringify(params) + '\n\n');
  try {
    return await client.query(query, params);
  } catch (err) {
    console.log(query, params);
    throw err;
  }
}
