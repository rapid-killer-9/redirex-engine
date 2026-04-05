const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const encode = (num: any): string => {
  if (num === undefined || num === null) {
    throw new Error("Encoder received undefined or null value");
  }
  
  let str = "";
  let n = BigInt(num);
  const base = BigInt(62);

  // FIX: Return the first character "0" if the ID is 0
  if (n === 0n) return ALPHABET;

  while (n > 0n) {
    str = ALPHABET[Number(n % base)] + str;
    n = n / base;
  }
  return str;
};
