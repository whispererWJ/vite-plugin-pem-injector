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
//  types
import type { RsaConfig, EnvVars } from './types';

/**
 * 处理RSA密钥
 * @param rsaConfigs RSA配置数组
 * @param pemDirPath PEM目录路径
 * @param isBuild 是否为构建模式
 */
export function processRsaKeys(
  rsaConfigs: RsaConfig[],
  pemDirPath: string,
  isBuild: boolean = false
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
      privateKeyHidden = isBuild, // build模式默认true，dev模式默认false
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
            format: 'pem',
          },
          privateKeyEncoding: {
            type: privateKeyEncodingType as 'pkcs8' | 'pkcs1' | 'sec1',
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
        console.log(`🔑 Generated new RSA keys for "${name}"`);
      } catch (error) {
        console.error(`Failed to generate RSA keys for "${name}":`, error);
        throw error;
      }
    }

    // 公钥始终注入到环境变量
    const publicKeyEnvName = getEnvVarName('VITE_RSA_PUBLIC_KEY', name, '');
    envVars[publicKeyEnvName] = publicKey;

    // 根据 privateKeyHidden 决定是否注入私钥
    if (!privateKeyHidden) {
      const privateKeyEnvName = getEnvVarName('VITE_RSA_PRIVATE_KEY', name, '');
      envVars[privateKeyEnvName] = privateKey;
      console.log(`🔓 RSA private key for "${name}" is exposed (privateKeyHidden: false)`);
    } else {
      console.log(`🔒 RSA private key for "${name}" is hidden (privateKeyHidden: true)`);
    }
  });

  return envVars;
}
