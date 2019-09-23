export const features = {
  wordSizeCoefficient: 2,
  wordStartMatchCoefficient: 5,
  wordRemoveEndings: 1,

  strictMatchByPhone: false,
  includeMatchedByPhone: 0.2,

  useFullNameForStreet: true,
  useFullNameForLocation: false,
  removeStreetWordFromStreetFullName: true,
  tryToCalculateDistanceToSecondStreetWord: true,
  tryToParseLocationAfterStreet: 0,
  distanceFromStartToStreet: true,

  houseError: 0,
  distanceFromHouseToStreet: false,

  distanceFromDealTypeToStreet: false,

  distanceFromOfferTypeToStreet: false,

  distanceFromRoomsToStreet: false,
};

export const weights = {
  street: 1.5,
  house: 0.5,
  dealtype: 0.5,
  offertype: 0.5,
  roomscount: 0.5,
  clicks: 1.0,
  daysFromCreationToCall: 0.01,
};

export const limits = {
  street: 0,
  house: 0.7,
  dealtype: 100,
  offertype: 0.7,
  roomscount: 0.7,
  clicks: 0,
  daysFromCreationToCall: 100,
};
