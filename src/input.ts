import { Pool } from 'pg';
import { DateTime } from 'luxon';
import { execQuery } from './db';
import * as fs from 'fs';

export interface IInputClick {
  realtyid: number;
  event_type: 'phone' | 'view' | 'call';
  event_timestamp: DateTime;
}

export interface IInputOffer {
  realtyid: number;
  userid: number;
  publisheduserid: number;
  creationdate: DateTime;
  geo_userinput: string;
  matched_by_phone: boolean;
  geo: {
    countryId: number;
    undergrounds: any[];
    calculatedUndergrounds: any[];
    coordinates: { lat: number; lng: number };
    publishCoordinates: { lat: number; lng: number };
    highways: any[];
    railways: any[];
    userInput: string;
    address: {
      name: string;
      id: number;
      locationTypeId?: number;
      fullName: string;
      type: string;
      shortName: string;
      isFormingAddress: boolean;
    }[];
    district: {
      parentId?: number;
      locationId: number;
      id: number;
      name: string;
      type: string;
    }[];
    locationPath: {
      countryId: number;
      childToParent: number[];
    };
  };
  category: string;
  floornumber: number;
  floorscount: number;
  roomscount: number;
  description: string;
  squarefull: number;
  pricerub: number;
}

export interface IPhrase {
  timestamp: number;
  type: 'incoming' | 'outgoing';
  text: string;
}

export interface IInputCall {
  calltrackingid: number;
  realtyuserid: number;
  mixedfilepath_hash: string;
  talk: IPhrase[];
  text: string;
  date: DateTime;
  region: number;
}

export interface IInputMarkup {
  address: string;
  flag_all: number;
  realtyuserid: number;
  realtyid: number;
  comment: string;
  who: string;
  bkt: string;
}

export interface IInputCase {
  call: IInputCall;
  offers: IInputOffer[];
  clicks: IInputClick[];
  markup: IInputMarkup | null;
}

const callsTable = 'calls';

const randomCallQuery = `
  select
    calltrackingid
  from
    ${callsTable}
  TABLESAMPLE SYSTEM_ROWS(1)
`;

const callsQuery = `
  select
    calltrackingid,
    realtyuserid,
    destinationphone_hash,
    mixedfilepath_hash,
    incomingtext,
    outgoingtext,
    jsonincoming,
    jsonoutgoing,
    date,
    region
  from
    ${callsTable}
  limit $1
  offset $2
`;

const callQuery = (ids: number[]) => `
  select
    calltrackingid,
    realtyuserid,
    destinationphone_hash,
    mixedfilepath_hash,
    incomingtext,
    outgoingtext,
    jsonincoming,
    jsonoutgoing,
    date,
    region
  from
    ${callsTable}
  where
    calltrackingid in (${ids.join(',')})
`;

const rasmetkaQuery = `
  select calltrackingid from rasmetka where flag_all = 1
`;

const offersQuery = `
  select
    realtyid,
    userid,
    publisheduserid,
    creationdate,
    geo_userinput,
    geo,
    category,
    floornumber,
    floorscount,
    roomscount,
    description,
    squarefull,
    realtyid in (
      select
        realtyid
      from
        ads_phones
      where
        destinationphone_hash = $4
        and ptn_dadd = $2
        and userid = $1
    ) as matched_by_phone,
    pricerub
  from
    ads
  where
    userid = $1
    and ptn_dadd = $2
    and creationdate < $3
`;

const clicksQuery = (ids: number[]) => `
  select
    realtyid,
    event_type,
    event_timestamp
  from
    events
  where
    realtyid in (${ids.join(',')})
    and event_timestamp < $1
`;

const markupQuery = `
  select
    address,
    flag_all,
    realtyuserid,
    realtyid,
    comment,
    who,
    bkt
  from
    rasmetka
  where
    calltrackingid = $1
`;

async function createCase(client: Pool, callRow: any): Promise<IInputCase> {
  const cachePath = `cache/${callRow.calltrackingid}.json`;
  if (fs.existsSync(cachePath)) {
    const inputCase = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    inputCase.call.date = DateTime.fromISO(inputCase.call.date);
    inputCase.offers.forEach((offer: any) => {
      offer.creationdate = DateTime.fromISO(offer.creationdate);
    });
    inputCase.clicks.forEach((click: any) => {
      click.event_timestamp = DateTime.fromISO(click.event_timestamp);
    });
    return inputCase;
  }

  const jsonincoming: any[] = JSON.parse(callRow.jsonincoming);
  const jsonoutgoing: any[] = JSON.parse(callRow.jsonoutgoing);

  const talk: IPhrase[] = jsonincoming
    .map(n => ({ ...n, type: 'incoming' }))
    .concat(jsonoutgoing.map(n => ({ ...n, type: 'outgoing' })))
    .filter(n => n.speech)
    .sort((a, b) => a.timestemp - b.timestemp)
    .map(n => ({
      timestamp: n.timestemp,
      type: n.type,
      text: n.speec_info.text,
    }));

  const text = talk.map(n => '- ' + n.text).join('\n');

  const call: IInputCall = {
    calltrackingid: callRow.calltrackingid,
    realtyuserid: callRow.realtyuserid,
    mixedfilepath_hash: callRow.mixedfilepath_hash,
    talk,
    text,
    date: DateTime.fromJSDate(callRow.date),
    region: callRow.region,
  };

  const offersRes = await execQuery(client, offersQuery, [
    call.realtyuserid,
    call.date.toFormat('yyyy-MM-dd 00:00:00.000'),
    call.date.toFormat('yyyy-MM-dd HH:mm:ss'),
    callRow.destinationphone_hash,
  ]);

  const offers = offersRes.rows.map(row => {
    const offer: IInputOffer = {
      realtyid: row.realtyid,
      userid: row.userid,
      publisheduserid: row.publisheduserid,
      matched_by_phone: row.matched_by_phone,
      creationdate: DateTime.fromJSDate(row.creationdate),
      geo_userinput: row.geo_userinput,
      geo: JSON.parse(row.geo),
      category: row.category,
      floornumber: row.floornumber,
      floorscount: row.floorscount,
      roomscount: row.roomscount,
      description: row.description,
      squarefull: row.squarefull,
      pricerub: row.pricerub,
    };

    return offer;
  });

  const clicksRes =
    offers.length > 0
      ? await execQuery(client, clicksQuery(offers.map(o => o.realtyid)), [
          call.date.plus({ minutes: 10 }).toFormat('yyyy-MM-dd HH:mm:ss'),
        ])
      : null;

  const clicks = clicksRes
    ? clicksRes.rows.map(row => {
        const click: IInputClick = {
          realtyid: row.realtyid,
          event_type: row.event_type,
          event_timestamp: DateTime.fromJSDate(row.event_timestamp),
        };

        return click;
      })
    : [];

  const markupRes = await execQuery(client, markupQuery, [call.calltrackingid]);

  const markup: IInputMarkup | null =
    markupRes.rowCount > 0
      ? {
          address: markupRes.rows[0].address,
          flag_all: markupRes.rows[0].flag_all,
          realtyuserid: markupRes.rows[0].realtyuserid,
          realtyid: markupRes.rows[0].realtyid,
          comment: markupRes.rows[0].comment,
          who: markupRes.rows[0].who,
          bkt: markupRes.rows[0].bkt,
        }
      : null;

  const inputCase: IInputCase = {
    call,
    offers,
    clicks,
    markup,
  };

  fs.writeFileSync(cachePath, JSON.stringify(inputCase));

  return inputCase;
}

export async function getRandomId(client: Pool): Promise<number | null> {
  const res = await execQuery(client, randomCallQuery);

  return res.rowCount > 0 ? res.rows[0].calltrackingid : null;
}

export async function readOne(
  client: Pool,
  id: number,
): Promise<IInputCase | null> {
  const res = await execQuery(client, callQuery([id]));

  return res.rowCount > 0 ? createCase(client, res.rows[0]) : null;
}

export async function* readInput(
  client: Pool,
): AsyncGenerator<IInputCase, void, void> {
  let offset = 0;
  const limit = 10;
  while (true) {
    const res = await execQuery(client, callsQuery, [limit, offset]);
    offset += limit;

    if (res.rowCount === 0) {
      break;
    }

    for (const row of res.rows) {
      const inputCase = await createCase(client, row);
      yield inputCase;
    }
  }
}

export async function getRasmetkaCalls(client: Pool) {
  const rasmetkaRes = await execQuery(client, rasmetkaQuery);

  return rasmetkaRes.rows.map(row => row.calltrackingid);
}

export async function* readRasmetka(
  client: Pool,
  ids: number[],
): AsyncGenerator<IInputCase, void, void> {
  const limit = 10;
  for (let i = 0; i < ids.length; i += limit) {
    const res = await execQuery(client, callQuery(ids.slice(i, i + limit)));

    for (const row of res.rows) {
      const inputCase = await createCase(client, row);
      yield inputCase;
    }
  }
}
