import crypto from 'crypto';
import {
  RsaConfig,
  EnvVars
} from './types';
import {
  ensureDirectoryExists,
  readTextFile,
  writeTextFile,
  getEnvVarName,
  getFileName,
  resolvePath,
  fileExists
} from './utils';

export function processRsaKeys(
  rsaConfigs: RsaConfig[],
  pemDirPath: string
): EnvVars {
  const envVars: EnvVars = {};
  ensureDirectoryExists(pemDirPath);

  rsaConfigs.forEach(config => {
    const { name, options } = config;
    const {
      modulusLength = 2048,
      publicKeyEncodingType = 'spki',
      privateKeyEncodingType = 'pkcs8',
      privateKeyCipher,
      privateKeyPassphrase
    } = options;

    const publicFilePath = resolvePath(pemDirPath, getFileName('rsa-public', name));
    const privateFilePath = resolvePath(pemDirPath, getFileName('rsa-private', name));

    let publicKey: string;
    let privateKey: string;

    if (fileExists(publicFilePath) && fileExists(privateFilePath)) {
      publicKey = readTextFile(publicFilePath)!;
      privateKey = readTextFile(privateFilePath)!;
      console.log(`✅ Loaded existing RSA keys for "${name}"`);
    } else {
      try {
        const keyPair = crypto.generateKeyPairSync('rsa', {
          modulusLength,
          publicKeyEncoding: {
            type: publicKeyEncodingType as 'spki' | 'pkcs1',
            format: 'pem'
          },
          privateKeyEncoding: {
            type: privateKeyEncodingType as 'pkcs8' | 'pkcs1' | 'sec1',
            format: 'pem',
            ...(privateKeyCipher && privateKeyPassphrase ? {
              cipher: privateKeyCipher,
              passphrase: privateKeyPassphrase
            } : {})
          }
        } as crypto.RSAKeyPairOptions<'pem', 'pem'>);

        publicKey = keyPair.publicKey;
        privateKey = keyPair.privateKey;
        writeTextFile(publicFilePath, publicKey);
        writeTextFile(privateFilePath, privateKey);
        console.log(`🔑 Generated new RSA keys for "${name}"`);
      } catch (error) {
        console.error(`Failed to generate RSA keys for "${name}":`, error);
        throw error;
      }
    }

    envVars[getEnvVarName('VITE_RSA_PUBLIC_KEY', name, '')] = publicKey;
    envVars[getEnvVarName('VITE_RSA_PRIVATE_KEY', name, '')] = privateKey;
  });

  return envVars;
}