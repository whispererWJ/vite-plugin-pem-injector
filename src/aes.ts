import crypto from 'crypto';
import {
  ensureDirectoryExists,
  readPemFile,
  writePemFile,
  getEnvVarName,
  getFileName,
  resolvePath
} from './utils';
// types
import type { AesConfig, AesPemContent, EnvVars } from './types';

/**
 * 处理AES密钥
 */
export function processAesKeys(
  aesConfigs: AesConfig[],
  pemDirPath: string,
  logCallback?: (key: string, message: string) => void
): EnvVars {
  const envVars: EnvVars = {};
  ensureDirectoryExists(pemDirPath);

  aesConfigs.forEach(config => {
    const { name, options } = config;
    const { keySize = 32, ivSize = 16 } = options;

    const filePath = resolvePath(pemDirPath, getFileName('aes', name));

    let key: string;
    let iv: string;

    const existing = readPemFile<AesPemContent>(filePath);
    
    if (existing?.key && existing?.iv) {
      key = existing.key;
      iv = existing.iv;
      logCallback?.(`aes-${name}`, `Loaded existing AES keys for "${name}"`);
    } else {
      key = crypto.randomBytes(keySize).toString('base64');
      iv = crypto.randomBytes(ivSize).toString('base64');
      writePemFile<AesPemContent>(filePath, { key, iv });
      logCallback?.(`aes-${name}`, `Generated new AES keys for "${name}"`);
    }

    envVars[getEnvVarName('VITE_AES_KEY', name, '')] = key;
    envVars[getEnvVarName('VITE_AES_IV', name, '')] = iv;
  });

  return envVars;
}