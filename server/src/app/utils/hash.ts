import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

export const hashValue = (value: string) => bcrypt.hash(value, SALT_ROUNDS);

export const compareHash = (value: string, hashedValue: string) => {
  return bcrypt.compare(value, hashedValue);
};
