drop table ads;
create table ads (
  realtyid int,
  userid int,
  publisheduserid int,
  ptn_dadd date,
  creationdate timestamp,
  isactive int,
  wasactive int,
  geo_userinput varchar,
  geo_address varchar,
  geo varchar,
  category varchar,
  floornumber float,
  floorscount float,
  roomscount float,
  bargainterms varchar,
  description varchar,
  squarefull float,
  landarea float,
  building varchar,
  repairtype varchar,
  pricerub float,
  geo_district varchar,
  street varchar,
  house varchar
);
copy ads from '/Users/vslinko/Workspace/ml-calltracking/data/ads.csv' DELIMITER ',' CSV HEADER;
create index on ads(userid);
create index on ads(realtyid);


drop table calls;
create table calls (
  calltrackingid int,
  realtyuserid int,
  calltrackingphone_hash varchar,
  sourcephone_hash varchar,
  destinationphone_hash varchar,
  outgoingfilepath_hash varchar,
  incomingfilepath_hash varchar,
  mixedfilepath_hash varchar,
  incomingtext varchar,
  outgoingtext varchar,
  jsonincoming varchar,
  jsonoutgoing varchar,
  region int,
  talkduration int,
  date timestamp,
  region__calltracing_number varchar,
  rn int
);
copy calls from '/Users/vslinko/Workspace/ml-calltracking/data/calls.csv' DELIMITER ',' CSV HEADER;


drop table events;
create table events (
  realtyid int,
  ab_group float,
  hit_id varchar,
  event_type varchar,
  event_timestamp timestamp
);
copy events from '/Users/vslinko/Workspace/ml-calltracking/data/events.csv' DELIMITER ',' CSV HEADER;
create index on events(realtyid);

drop table rasmetka;
create table rasmetka (
  calltrackingid int,
  address varchar,
  flag_all int,
  realtyuserid float,
  realtyid float,
  comment varchar,
  who varchar,
  bkt varchar
);
copy rasmetka from '/Users/vslinko/Workspace/ml-calltracking/data/rasmetka.csv' DELIMITER ',' CSV HEADER;
create index on rasmetka(calltrackingid);

drop table ads_phones;
create table ads_phones (
  realtyid int,
  userid int,
  ptn_dadd date,
  destinationphone_hash varchar
);
copy ads_phones from '/Users/vslinko/Workspace/ml-calltracking/data/ads_phones.csv' DELIMITER ',' CSV HEADER;
