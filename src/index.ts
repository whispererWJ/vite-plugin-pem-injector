import { Plugin } from 'vite';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
// types
import type { PemInjectorOptions } from './types';

export default function PemInjector(options: PemInjectorOptions = {}): Plugin {
  const { pemDir = './pem', aes = [], rsa = [] } = options;

  function ensureDirectory(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  function processAesKeys(): Record<string, string> {
    const envVars: Record<string, string> = {};
    const pemDirPath = path.resolve(process.cwd(), pemDir);
    ensureDirectory(pemDirPath);

    aes.forEach((config) => {
      const { name, options } = config;
      const { keySize = 32, ivSize = 16 } = options;
      const filePath = path.join(pemDirPath, `aes-${name}.pem`);

      let key: string, iv: string;

      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(content);
        key = parsed.key;
        iv = parsed.iv;
      } else {
        key = crypto.randomBytes(keySize).toString('base64');
        iv = crypto.randomBytes(ivSize).toString('base64');
        fs.writeFileSync(filePath, JSON.stringify({ key, iv }, null, 2));
      }

      envVars[`VITE_AES_KEY_${name.toUpperCase()}`] = key;
      envVars[`VITE_AES_IV_${name.toUpperCase()}`] = iv;
    });

    return envVars;
  }

  function processRsaKeys(): Record<string, string> {
    const envVars: Record<string, string> = {};
    const pemDirPath = path.resolve(process.cwd(), pemDir);
    ensureDirectory(pemDirPath);

    rsa.forEach((config) => {
      const { name, options } = config;
      const {
        modulusLength = 2048,
        publicKeyEncodingType = 'spki',
        privateKeyEncodingType = 'pkcs8',
        privateKeyCipher,
        privateKeyPassphrase,
      } = options;

      const publicPath = path.join(pemDirPath, `rsa-public-${name}.pem`);
      const privatePath = path.join(pemDirPath, `rsa-private-${name}.pem`);

      let publicKey: string, privateKey: string;

      if (fs.existsSync(publicPath) && fs.existsSync(privatePath)) {
        publicKey = fs.readFileSync(publicPath, 'utf8');
        privateKey = fs.readFileSync(privatePath, 'utf8');
      } else {
        const keyPair = crypto.generateKeyPairSync('rsa', {
          modulusLength,
          publicKeyEncoding: {
            type: publicKeyEncodingType as any,
            format: 'pem',
          },
          privateKeyEncoding: {
            type: privateKeyEncodingType as any,
            format: 'pem',
            ...(privateKeyCipher && privateKeyPassphrase
              ? {
                  cipher: privateKeyCipher,
                  passphrase: privateKeyPassphrase,
                }
              : {}),
          },
        });

        publicKey = keyPair.publicKey;
        privateKey = keyPair.privateKey;

        fs.writeFileSync(publicPath, publicKey);
        fs.writeFileSync(privatePath, privateKey);
      }

      envVars[`VITE_RSA_PUBLIC_KEY_${name.toUpperCase()}`] = publicKey;
      envVars[`VITE_RSA_PRIVATE_KEY_${name.toUpperCase()}`] = privateKey;
    });

    return envVars;
  }

  return {
    name: 'vite-plugin-pem-injector',

    config() {
      try {
        const envVars = {
          ...processAesKeys(),
          ...processRsaKeys(),
        };

        return {
          define: Object.keys(envVars).reduce(
            (acc, key) => {
              acc[`import.meta.env.${key}`] = JSON.stringify(envVars[key]);
              return acc;
            },
            {} as Record<string, string>
          ),
        };
      } catch (error) {
        console.error('[vite-plugin-pem-injector] Failed to process keys:', error);
        return {};
      }
    },

    configureServer() {
      try {
        const envVars = {
          ...processAesKeys(),
          ...processRsaKeys(),
        };
        Object.assign(process.env, envVars);
      } catch (error) {
        console.error('[vite-plugin-pem-injector] Failed to inject env vars:', error);
      }
    },
  };
}
