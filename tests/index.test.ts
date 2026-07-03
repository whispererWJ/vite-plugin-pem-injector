// tests/index.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import PemInjector from '../src/index';
import {
  executeConfigHook,
  comparePemContent,
  parseEnvValue,
  cleanupTestDir,
  createTestAesFile,
  createTestRsaFiles,
  generateTestPublicKey,
  generateTestPrivateKey,
  getDefineFromConfig
} from './helpers';

describe('vite-plugin-pem-injector', () => {
  const testPemDir = path.join(__dirname, '.test-pem');

  beforeEach(() => {
    cleanupTestDir(testPemDir);
  });

  afterEach(() => {
    cleanupTestDir(testPemDir);
  });

  // ============ 基础功能测试 ============

  describe('基础功能', () => {
    it('should create plugin instance', () => {
      const plugin = PemInjector({
        pemDir: testPemDir,
        aes: [{ name: 'test', options: { keySize: 32, ivSize: 16 } }],
      });

      expect(plugin).toBeDefined();
      expect(plugin.name).toBe('vite-plugin-pem-injector');
    });

    it('should generate AES keys', async () => {
      const plugin = PemInjector({
        pemDir: testPemDir,
        aes: [{ name: 'test', options: { keySize: 32, ivSize: 16 } }],
      });

      const result = await executeConfigHook(plugin);
      const define = getDefineFromConfig(result);
      
      expect(define['import.meta.env.VITE_AES_KEY_TEST']).toBeDefined();
      expect(define['import.meta.env.VITE_AES_IV_TEST']).toBeDefined();

      const pemFilePath = path.join(testPemDir, 'aes-test.pem');
      expect(fs.existsSync(pemFilePath)).toBe(true);
      
      const content = JSON.parse(fs.readFileSync(pemFilePath, 'utf8'));
      expect(content.key).toBeDefined();
      expect(content.iv).toBeDefined();
    });

    it('should generate RSA keys', async () => {
      const plugin = PemInjector({
        pemDir: testPemDir,
        rsa: [{
          name: 'test',
          options: {
            modulusLength: 2048,
            publicKeyEncodingType: 'spki',
            privateKeyEncodingType: 'pkcs8',
          },
        }],
      });

      const result = await executeConfigHook(plugin);
      const define = getDefineFromConfig(result);
      
      expect(define['import.meta.env.VITE_RSA_PUBLIC_KEY_TEST']).toBeDefined();

      const publicPath = path.join(testPemDir, 'rsa-public-test.pem');
      const privatePath = path.join(testPemDir, 'rsa-private-test.pem');
      expect(fs.existsSync(publicPath)).toBe(true);
      expect(fs.existsSync(privatePath)).toBe(true);

      const publicContent = fs.readFileSync(publicPath, 'utf8');
      const privateContent = fs.readFileSync(privatePath, 'utf8');
      expect(publicContent).toContain('BEGIN');
      expect(privateContent).toContain('BEGIN');
    });

    it('should handle empty configuration', async () => {
      const plugin = PemInjector({ pemDir: testPemDir });
      const result = await executeConfigHook(plugin);
      const define = getDefineFromConfig(result);
      expect(Object.keys(define)).toHaveLength(0);
    });
  });

  // ============ 密钥复用测试 ============

  describe('密钥复用', () => {
    it('should reuse existing AES keys', async () => {
      const existingKey = 'existing-test-key';
      const existingIv = 'existing-test-iv';
      createTestAesFile(testPemDir, 'test', existingKey, existingIv);

      const plugin = PemInjector({
        pemDir: testPemDir,
        aes: [{ name: 'test', options: { keySize: 32, ivSize: 16 } }],
      });

      const result = await executeConfigHook(plugin);
      const define = getDefineFromConfig(result);
      
      expect(parseEnvValue(define['import.meta.env.VITE_AES_KEY_TEST'])).toBe(existingKey);
      expect(parseEnvValue(define['import.meta.env.VITE_AES_IV_TEST'])).toBe(existingIv);
    });

    it('should reuse existing RSA keys', async () => {
      const publicKey = generateTestPublicKey();
      const privateKey = generateTestPrivateKey();
      createTestRsaFiles(testPemDir, 'test', publicKey, privateKey);

      const plugin = PemInjector({
        pemDir: testPemDir,
        rsa: [{
          name: 'test',
          options: {
            modulusLength: 2048,
            publicKeyEncodingType: 'spki',
            privateKeyEncodingType: 'pkcs8',
            privateKeyHidden: false,
          },
        }],
      });

      const result = await executeConfigHook(
        plugin,
        {},
        { command: 'serve', mode: 'development' }
      );
      const define = getDefineFromConfig(result);
      
      const actualPublicKey = parseEnvValue(define['import.meta.env.VITE_RSA_PUBLIC_KEY_TEST']);
      const actualPrivateKey = parseEnvValue(define['import.meta.env.VITE_RSA_PRIVATE_KEY_TEST']);
      
      expect(comparePemContent(publicKey, actualPublicKey)).toBe(true);
      expect(comparePemContent(privateKey, actualPrivateKey)).toBe(true);
    });
  });

  // ============ 多配置测试 ============

  describe('多配置支持', () => {
    it('should handle multiple AES configurations', async () => {
      const plugin = PemInjector({
        pemDir: testPemDir,
        aes: [
          { name: 'main', options: { keySize: 32, ivSize: 16 } },
          { name: 'sub', options: { keySize: 24, ivSize: 16 } },
        ],
      });

      const result = await executeConfigHook(plugin);
      const define = getDefineFromConfig(result);
      
      expect(define['import.meta.env.VITE_AES_KEY_MAIN']).toBeDefined();
      expect(define['import.meta.env.VITE_AES_IV_MAIN']).toBeDefined();
      expect(define['import.meta.env.VITE_AES_KEY_SUB']).toBeDefined();
      expect(define['import.meta.env.VITE_AES_IV_SUB']).toBeDefined();

      expect(fs.existsSync(path.join(testPemDir, 'aes-main.pem'))).toBe(true);
      expect(fs.existsSync(path.join(testPemDir, 'aes-sub.pem'))).toBe(true);
    });

    it('should handle multiple RSA configurations', async () => {
      const plugin = PemInjector({
        pemDir: testPemDir,
        rsa: [
          {
            name: 'main',
            options: {
              modulusLength: 2048,
              publicKeyEncodingType: 'spki',
              privateKeyEncodingType: 'pkcs8',
              privateKeyHidden: false,
            },
          },
          {
            name: 'sub',
            options: {
              modulusLength: 2048,
              publicKeyEncodingType: 'pkcs1',
              privateKeyEncodingType: 'pkcs1',
              privateKeyHidden: false,
            },
          },
        ],
      });

      const result = await executeConfigHook(
        plugin,
        {},
        { command: 'serve', mode: 'development' }
      );
      const define = getDefineFromConfig(result);
      
      expect(define['import.meta.env.VITE_RSA_PUBLIC_KEY_MAIN']).toBeDefined();
      expect(define['import.meta.env.VITE_RSA_PRIVATE_KEY_MAIN']).toBeDefined();
      expect(define['import.meta.env.VITE_RSA_PUBLIC_KEY_SUB']).toBeDefined();
      expect(define['import.meta.env.VITE_RSA_PRIVATE_KEY_SUB']).toBeDefined();

      expect(fs.existsSync(path.join(testPemDir, 'rsa-public-main.pem'))).toBe(true);
      expect(fs.existsSync(path.join(testPemDir, 'rsa-private-main.pem'))).toBe(true);
      expect(fs.existsSync(path.join(testPemDir, 'rsa-public-sub.pem'))).toBe(true);
      expect(fs.existsSync(path.join(testPemDir, 'rsa-private-sub.pem'))).toBe(true);
    });

    it('should handle mixed AES and RSA configurations', async () => {
      const plugin = PemInjector({
        pemDir: testPemDir,
        aes: [{ name: 'test', options: { keySize: 32, ivSize: 16 } }],
        rsa: [{
          name: 'test',
          options: {
            modulusLength: 2048,
            publicKeyEncodingType: 'spki',
            privateKeyEncodingType: 'pkcs8',
            privateKeyHidden: false,
          },
        }],
      });

      const result = await executeConfigHook(
        plugin,
        {},
        { command: 'serve', mode: 'development' }
      );
      const define = getDefineFromConfig(result);
      
      expect(define['import.meta.env.VITE_AES_KEY_TEST']).toBeDefined();
      expect(define['import.meta.env.VITE_AES_IV_TEST']).toBeDefined();
      expect(define['import.meta.env.VITE_RSA_PUBLIC_KEY_TEST']).toBeDefined();
      expect(define['import.meta.env.VITE_RSA_PRIVATE_KEY_TEST']).toBeDefined();
    });
  });

  // ============ 环境变量注入测试 ============

  describe('环境变量注入', () => {
    it('should inject environment variables on configureServer', () => {
      const plugin = PemInjector({
        pemDir: testPemDir,
        aes: [{ name: 'test', options: { keySize: 32, ivSize: 16 } }],
      });

      const configureServerHook = plugin.configureServer;
      const serverMock = {} as any;

      if (typeof configureServerHook === 'function') {
        configureServerHook(serverMock);
      } else if (configureServerHook && typeof configureServerHook === 'object' && 'handler' in configureServerHook) {
        configureServerHook.handler(serverMock);
      }

      expect(process.env.VITE_AES_KEY_TEST).toBeDefined();
      expect(process.env.VITE_AES_IV_TEST).toBeDefined();
    });

    it('should inject RSA keys on configureServer', () => {
      const plugin = PemInjector({
        pemDir: testPemDir,
        rsa: [{
          name: 'test',
          options: {
            modulusLength: 2048,
            publicKeyEncodingType: 'spki',
            privateKeyEncodingType: 'pkcs8',
            privateKeyHidden: false,
          },
        }],
      });

      const configureServerHook = plugin.configureServer;
      const serverMock = {} as any;

      if (typeof configureServerHook === 'function') {
        configureServerHook(serverMock);
      } else if (configureServerHook && typeof configureServerHook === 'object' && 'handler' in configureServerHook) {
        configureServerHook.handler(serverMock);
      }

      expect(process.env.VITE_RSA_PUBLIC_KEY_TEST).toBeDefined();
      expect(process.env.VITE_RSA_PRIVATE_KEY_TEST).toBeDefined();
    });
  });

  // ============ RSA 私钥隐藏功能测试 ============

  describe('RSA私钥隐藏功能', () => {
    it('should hide private key in build mode by default', async () => {
      const plugin = PemInjector({
        pemDir: testPemDir,
        rsa: [{
          name: 'test',
          options: {
            modulusLength: 2048,
            publicKeyEncodingType: 'spki',
            privateKeyEncodingType: 'pkcs8',
          },
        }],
      });

      const result = await executeConfigHook(
        plugin,
        {},
        { command: 'build', mode: 'production' }
      );
      const define = getDefineFromConfig(result);
      
      expect(define['import.meta.env.VITE_RSA_PUBLIC_KEY_TEST']).toBeDefined();
      expect(define['import.meta.env.VITE_RSA_PRIVATE_KEY_TEST']).toBeUndefined();
    });

    it('should expose private key in dev mode by default', async () => {
      const plugin = PemInjector({
        pemDir: testPemDir,
        rsa: [{
          name: 'test',
          options: {
            modulusLength: 2048,
            publicKeyEncodingType: 'spki',
            privateKeyEncodingType: 'pkcs8',
          },
        }],
      });

      const result = await executeConfigHook(
        plugin,
        {},
        { command: 'serve', mode: 'development' }
      );
      const define = getDefineFromConfig(result);
      
      expect(define['import.meta.env.VITE_RSA_PUBLIC_KEY_TEST']).toBeDefined();
      expect(define['import.meta.env.VITE_RSA_PRIVATE_KEY_TEST']).toBeDefined();
    });

    it('should hide private key when privateKeyHidden is true', async () => {
      const plugin = PemInjector({
        pemDir: testPemDir,
        rsa: [{
          name: 'test',
          options: {
            modulusLength: 2048,
            publicKeyEncodingType: 'spki',
            privateKeyEncodingType: 'pkcs8',
            privateKeyHidden: true,
          },
        }],
      });

      const result = await executeConfigHook(plugin);
      const define = getDefineFromConfig(result);
      
      expect(define['import.meta.env.VITE_RSA_PUBLIC_KEY_TEST']).toBeDefined();
      expect(define['import.meta.env.VITE_RSA_PRIVATE_KEY_TEST']).toBeUndefined();
    });

    it('should expose private key when privateKeyHidden is false', async () => {
      const plugin = PemInjector({
        pemDir: testPemDir,
        rsa: [{
          name: 'test',
          options: {
            modulusLength: 2048,
            publicKeyEncodingType: 'spki',
            privateKeyEncodingType: 'pkcs8',
            privateKeyHidden: false,
          },
        }],
      });

      const result = await executeConfigHook(
        plugin,
        {},
        { command: 'build', mode: 'production' }
      );
      const define = getDefineFromConfig(result);
      
      expect(define['import.meta.env.VITE_RSA_PUBLIC_KEY_TEST']).toBeDefined();
      expect(define['import.meta.env.VITE_RSA_PRIVATE_KEY_TEST']).toBeDefined();
    });

    it('should use existing private key when not hidden', async () => {
      const publicKey = generateTestPublicKey();
      const privateKey = generateTestPrivateKey();
      createTestRsaFiles(testPemDir, 'test', publicKey, privateKey);

      const plugin = PemInjector({
        pemDir: testPemDir,
        rsa: [{
          name: 'test',
          options: {
            modulusLength: 2048,
            publicKeyEncodingType: 'spki',
            privateKeyEncodingType: 'pkcs8',
            privateKeyHidden: false,
          },
        }],
      });

      const result = await executeConfigHook(
        plugin,
        {},
        { command: 'serve', mode: 'development' }
      );
      const define = getDefineFromConfig(result);
      
      const actualPublicKey = parseEnvValue(define['import.meta.env.VITE_RSA_PUBLIC_KEY_TEST']);
      const actualPrivateKey = parseEnvValue(define['import.meta.env.VITE_RSA_PRIVATE_KEY_TEST']);
      
      expect(comparePemContent(publicKey, actualPublicKey)).toBe(true);
      expect(comparePemContent(privateKey, actualPrivateKey)).toBe(true);
    });
  });

  // ============ RSA 加密私钥测试 ============

  describe('RSA加密私钥', () => {
    it('should handle RSA keys with encryption', async () => {
      const plugin = PemInjector({
        pemDir: testPemDir,
        rsa: [{
          name: 'encrypted',
          options: {
            modulusLength: 2048,
            publicKeyEncodingType: 'spki',
            privateKeyEncodingType: 'pkcs8',
            privateKeyCipher: 'aes-256-cbc',
            privateKeyPassphrase: 'test-password',
            privateKeyHidden: false,
          },
        }],
      });

      const result = await executeConfigHook(
        plugin,
        {},
        { command: 'serve', mode: 'development' }
      );
      const define = getDefineFromConfig(result);
      
      expect(define['import.meta.env.VITE_RSA_PUBLIC_KEY_ENCRYPTED']).toBeDefined();
      expect(define['import.meta.env.VITE_RSA_PRIVATE_KEY_ENCRYPTED']).toBeDefined();

      const privateKeyContent = parseEnvValue(define['import.meta.env.VITE_RSA_PRIVATE_KEY_ENCRYPTED']);
      expect(privateKeyContent).toContain('ENCRYPTED');
    });

    it('should reuse encrypted RSA keys', async () => {
      const publicKey = generateTestPublicKey();
      const privateKey = `-----BEGIN ENCRYPTED PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cJh
kzpiAXe3cbzFfkfko7svw/8v/R4uB8z8CxG5L6M7N8O9P0Q1R2S3T4U5V6W7X8Y9Z0
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6A7B8C9D0E1F2G
-----END ENCRYPTED PRIVATE KEY-----`;
      
      createTestRsaFiles(testPemDir, 'encrypted', publicKey, privateKey);

      const plugin = PemInjector({
        pemDir: testPemDir,
        rsa: [{
          name: 'encrypted',
          options: {
            modulusLength: 2048,
            publicKeyEncodingType: 'spki',
            privateKeyEncodingType: 'pkcs8',
            privateKeyCipher: 'aes-256-cbc',
            privateKeyPassphrase: 'test-password',
            privateKeyHidden: false,
          },
        }],
      });

      const result = await executeConfigHook(
        plugin,
        {},
        { command: 'serve', mode: 'development' }
      );
      const define = getDefineFromConfig(result);
      
      const actualPrivateKey = parseEnvValue(define['import.meta.env.VITE_RSA_PRIVATE_KEY_ENCRYPTED']);
      expect(actualPrivateKey).toContain('ENCRYPTED');
    });
  });

  // ============ 错误处理测试 ============

  describe('错误处理', () => {
    it('should handle invalid RSA options gracefully', async () => {
      const plugin = PemInjector({
        pemDir: testPemDir,
        rsa: [{
          name: 'test',
          options: {
            modulusLength: 512,
            publicKeyEncodingType: 'spki',
            privateKeyEncodingType: 'pkcs8',
          },
        }],
      });

      const result = await executeConfigHook(plugin);
      const define = getDefineFromConfig(result);
      
      // 即使密钥长度不安全，应该仍然能生成密钥
      expect(define['import.meta.env.VITE_RSA_PUBLIC_KEY_TEST']).toBeDefined();
    });

    it('should handle missing pemDir gracefully', async () => {
      const plugin = PemInjector({
        aes: [{ name: 'test', options: { keySize: 32, ivSize: 16 } }],
      });

      const result = await executeConfigHook(plugin);
      const define = getDefineFromConfig(result);
      
      expect(define['import.meta.env.VITE_AES_KEY_TEST']).toBeDefined();
      expect(define['import.meta.env.VITE_AES_IV_TEST']).toBeDefined();
      
      // 清理默认目录
      const defaultPemDir = path.join(process.cwd(), 'pem');
      cleanupTestDir(defaultPemDir);
    });
  });

  // ============ 性能测试 ============

  describe('性能', () => {
    it('should generate multiple RSA keys efficiently', async () => {
      const plugin = PemInjector({
        pemDir: testPemDir,
        rsa: [
          { name: 'key1', options: { modulusLength: 2048, privateKeyHidden: false } },
          { name: 'key2', options: { modulusLength: 2048, privateKeyHidden: false } },
          { name: 'key3', options: { modulusLength: 2048, privateKeyHidden: false } },
        ],
      });

      const startTime = Date.now();
      const result = await executeConfigHook(
        plugin,
        {},
        { command: 'serve', mode: 'development' }
      );
      const endTime = Date.now();
      
      const define = getDefineFromConfig(result);
      expect(define['import.meta.env.VITE_RSA_PUBLIC_KEY_KEY1']).toBeDefined();
      expect(define['import.meta.env.VITE_RSA_PUBLIC_KEY_KEY2']).toBeDefined();
      expect(define['import.meta.env.VITE_RSA_PUBLIC_KEY_KEY3']).toBeDefined();
      
      // 生成3个RSA密钥应该在合理时间内完成
      expect(endTime - startTime).toBeLessThan(15000);
    });
  });
});