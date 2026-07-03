import crypto from 'crypto';
import {
  ensureDirectoryExists,
  readTextFile,
  writeTextFile,
  getEnvVarName,
  getFileName,
  resolvePath,
  fileExists,
} from './utils';
// types
import type { RsaConfig, EnvVars } from './types';

/**
 * 处理RSA密钥
 */
export function processRsaKeys(
  rsaConfigs: RsaConfig[],
  pemDirPath: string,
  isBuild: boolean = false,
  logCallback?: (key: string, message: string) => void
): EnvVars {
  const envVars: EnvVars = {};
  ensureDirectoryExists(pemDirPath);

  rsaConfigs.forEach((config) => {
    const { name, options } = config;
    const {
      modulusLength = 2048,
      publicKeyEncodingType = 'spki',
      privateKeyEncodingType = 'pkcs8',
      privateKeyCipher,
      privateKeyPassphrase,
      privateKeyHidden = isBuild,
    } = options;

    const publicFilePath = resolvePath(pemDirPath, getFileName('rsa-public', name));
    const privateFilePath = resolvePath(pemDirPath, getFileName('rsa-private', name));

    let publicKey: string;
    let privateKey: string;

    if (fileExists(publicFilePath) && fileExists(privateFilePath)) {
      publicKey = readTextFile(publicFilePath)!;
      privateKey = readTextFile(privateFilePath)!;
      logCallback?.(`rsa-${name}`, `Loaded existing RSA keys for "${name}"`);
    } else {
      const keyPair = crypto.generateKeyPairSync('rsa', {
        modulusLength,
        publicKeyEncoding: {
          type: publicKeyEncodingType,
          format: 'pem',
        },
        privateKeyEncoding: {
          type: privateKeyEncodingType,
          format: 'pem',
          ...(privateKeyCipher && privateKeyPassphrase
            ? {
                cipher: privateKeyCipher,
                passphrase: privateKeyPassphrase,
              }
            : {}),
        },
      } as crypto.RSAKeyPairOptions<'pem', 'pem'>);

      publicKey = keyPair.publicKey;
      privateKey = keyPair.privateKey;
      writeTextFile(publicFilePath, publicKey);
      writeTextFile(privateFilePath, privateKey);
      logCallback?.(`rsa-${name}`, `Generated new RSA keys for "${name}"`);
    }

    // 公钥始终注入
    envVars[getEnvVarName('VITE_RSA_PUBLIC_KEY', name, '')] = publicKey;

    // 根据 privateKeyHidden 决定是否注入私钥
    if (!privateKeyHidden) {
      envVars[getEnvVarName('VITE_RSA_PRIVATE_KEY', name, '')] = privateKey;
      logCallback?.(
        `private-${name}`,
        `RSA private key for "${name}" is exposed (privateKeyHidden: false)`
      );
    } else {
      logCallback?.(
        `private-${name}`,
        `RSA private key for "${name}" is hidden (privateKeyHidden: true)`
      );
    }
  });

  return envVars;
}
