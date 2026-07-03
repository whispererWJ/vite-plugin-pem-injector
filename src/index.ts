import { Plugin } from 'vite';
import { processAesKeys } from './aes';
import { processRsaKeys } from './rsa';
import { resolvePath } from './utils';
// types
import type { PemInjectorOptions, EnvVars } from './types';

/**
 * Vite插件：注入PEM文件到环境变量
 */
export default function PemInjector(options: PemInjectorOptions = {}): Plugin {
  const {
    pemDir = './pem',
    aes = [],
    rsa = [],
    silent = false
  } = options;

  // 日志去重
  const logCache = new Set<string>();

  function logOnce(key: string, message: string): void {
    if (silent) return;
    if (logCache.has(key)) return;
    logCache.add(key);
    console.log(message);
  }

  function resetLogCache(): void {
    logCache.clear();
  }

  function processKeys(isBuild: boolean = false): EnvVars {
    const pemDirPath = resolvePath(process.cwd(), pemDir);

    const aesEnvVars = processAesKeys(aes, pemDirPath, (key, msg) => {
      logOnce(key, `✅ ${msg}`);
    });

    const rsaEnvVars = processRsaKeys(rsa, pemDirPath, isBuild, (key, msg) => {
      const emoji = key.startsWith('private-') ? '🔒' : '✅';
      logOnce(key, `${emoji} ${msg}`);
    });

    return { ...aesEnvVars, ...rsaEnvVars };
  }

  return {
    name: 'vite-plugin-pem-injector',

    config(_config, env) {
      try {
        resetLogCache();
        const isBuild = env.command === 'build';
        const envVars = processKeys(isBuild);

        logOnce('mode', `📦 [vite-plugin-pem-injector] Running in ${isBuild ? 'build' : 'dev'} mode`);

        return {
          define: Object.keys(envVars).reduce((acc, key) => {
            acc[`import.meta.env.${key}`] = JSON.stringify(envVars[key]);
            return acc;
          }, {} as Record<string, string>)
        };
      } catch (error) {
        if (!silent) {
          console.error('[vite-plugin-pem-injector] Failed to process keys:', error);
        }
        return {};
      }
    },

    configureServer() {
      try {
        resetLogCache();
        const envVars = processKeys(false);
        Object.assign(process.env, envVars);
        logOnce('mode', '🔧 [vite-plugin-pem-injector] Dev server started');
      } catch (error) {
        if (!silent) {
          console.error('[vite-plugin-pem-injector] Failed to inject env vars:', error);
        }
      }
    }
  };
}

export * from './types';