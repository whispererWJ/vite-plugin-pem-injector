import { Plugin } from 'vite';
import { processAesKeys } from './aes';
import { processRsaKeys } from './rsa';
import { resolvePath } from './utils';
// types
import type { PemInjectorOptions, EnvVars } from './types';

/**
 * Vite插件：注入PEM文件到环境变量
 * 生成或读取AES和RSA密钥对，并注入到环境变量中
 */
export default function PemInjector(options: PemInjectorOptions = {}): Plugin {
  const { pemDir = './pem', aes = [], rsa = [] } = options;

  let currentMode: 'dev' | 'build' = 'dev';

  /**
   * 处理所有密钥并返回环境变量
   */
  function processKeys(isBuild: boolean = false): EnvVars {
    const pemDirPath = resolvePath(process.cwd(), pemDir);

    // 处理AES密钥
    const aesEnvVars = processAesKeys(aes, pemDirPath);

    // 处理RSA密钥，传入构建模式标志
    const rsaEnvVars = processRsaKeys(rsa, pemDirPath, isBuild);

    // 合并所有环境变量
    return {
      ...aesEnvVars,
      ...rsaEnvVars,
    };
  }

  return {
    name: 'vite-plugin-pem-injector',

    /**
     * 在配置解析之前执行，注入环境变量到Vite配置
     */
    config(_, env) {
      try {
        // 判断是否为构建模式
        const isBuild = env.command === 'build';
        currentMode = isBuild ? 'build' : 'dev';

        const envVars = processKeys(isBuild);

        console.log(`📦 [vite-plugin-pem-injector] Running in ${currentMode} mode`);

        // 将环境变量注入到Vite的define中
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

    /**
     * 配置解析完成后的钩子
     */
    configResolved() {},

    /**
     * 开发服务器启动时的钩子
     */
    configureServer() {
      try {
        // dev模式下使用 privateKeyHidden 默认值 false
        const envVars = processKeys(false);
        // 将环境变量注入到进程环境中
        Object.assign(process.env, envVars);
        console.log('🔧 [vite-plugin-pem-injector] Dev server started');
      } catch (error) {
        console.error('[vite-plugin-pem-injector] Failed to inject env vars:', error);
      }
    },

    /**
     * 构建开始前的钩子
     */
    buildStart() {
      try {
        // build模式下使用 privateKeyHidden 默认值 true
        processKeys(true);
        console.log('🏗️  [vite-plugin-pem-injector] Build started');
      } catch (error) {
        console.error('[vite-plugin-pem-injector] Failed during build start:', error);
      }
    },
  };
}

// 导出类型定义
export * from './types';
