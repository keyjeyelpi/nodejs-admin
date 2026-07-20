import { createCryptoClient } from '@keyjeyelpi/encryption';

const secretKey = "keyjeyelpi";

export const encryption = createCryptoClient(secretKey);

export const { encrypt, decrypt, hash, createSignature } = encryption;