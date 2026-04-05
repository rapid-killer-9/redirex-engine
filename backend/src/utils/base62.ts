const CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const encode = (num: number): string => {
  let str = "";
  while (num > 0) {
    str = CHARS[num % 62] + str;
    num = Math.floor(num / 62);
  }
  return str || "0";
};