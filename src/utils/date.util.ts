/**
 * Returns a new Date object representing the current UTC time
 * @returns Date object in UTC timezone
 */
export const getCurrentUTCTime = (): Date => {
  return new Date();
};

/**
 * Returns a Date object from a timestamp in UTC
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Date object in UTC timezone
 */
export const getUTCDateFromTimestamp = (timestamp: number): Date => {
  return new Date(timestamp);
};
