// tests/index.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import PemInjector from '../src/index';
import {
  executeConfigHook,
  comparePemContent,
  parseEnvValue,
  createTestDir,
  cleanupTestDir,
  createTestAesFile,
  createTestRsaFiles,
  generateTestPublicKey,
  generateTestPrivateKey
} from './helpers';

describe('vite-plugin-pem-injector', () => {
  const testPemDir = path.join(__dirname, '.test-pem');

  beforeEach(() => {
    cleanupTestDir(testPemDir);
  });

  afterEach(() => {
    cleanupTestDir(testPemDir);
  });

  it('should create plugin instance', () => {
    const plugin = PemInjector({
      pemDir: testPemDir,
      aes: [
        {
          name: 'test',
          options: {
            keySize: 32,
            ivSize: 16,
          },
        },
      ],
    });

    expect(plugin).toBeDefined();
    expect(plugin.name).toBe('vite-plugin-pem-injector');
  });

  it('should generate AES keys', async () => {
    const plugin = PemInjector({
      pemDir: testPemDir,
      aes: [
        {
          name: 'test',
          options: {
            keySize: 32,
            ivSize: 16,
          },
        },
      ],
    });

    const result = await executeConfigHook(plugin);
    expect(result).toBeDefined();
    expect(result?.define).toBeDefined();

    const define = result!.define as Record<string, string>;
    expect(define['import.meta.env.VITE_AES_KEY_TEST']).toBeDefined();
    expect(define['import.meta.env.VITE_AES_IV_TEST']).toBeDefined();

    // 验证文件是否生成
    const pemFilePath = path.join(testPemDir, 'aes-test.pem');
    expect(fs.existsSync(pemFilePath)).toBe(true);

    const content = JSON.parse(fs.readFileSync(pemFilePath, 'utf8'));
    expect(content.key).toBeDefined();
    expect(content.iv).toBeDefined();
  });

  it('should generate RSA keys', async () => {
    const plugin = PemInjector({
      pemDir: testPemDir,
      rsa: [
        {
          name: 'test',
          options: {
            modulusLength: 2048,
            publicKeyEncodingType: 'spki',
            privateKeyEncodingType: 'pkcs8',
          },
        },
      ],
    });

    const result = await executeConfigHook(plugin);
    expect(result).toBeDefined();
    expect(result?.define).toBeDefined();

    const define = result!.define as Record<string, string>;
    expect(define['import.meta.env.VITE_RSA_PUBLIC_KEY_TEST']).toBeDefined();
    expect(define['import.meta.env.VITE_RSA_PRIVATE_KEY_TEST']).toBeDefined();

    // 验证文件是否生成
    const publicPath = path.join(testPemDir, 'rsa-public-test.pem');
    const privatePath = path.join(testPemDir, 'rsa-private-test.pem');
    expect(fs.existsSync(publicPath)).toBe(true);
    expect(fs.existsSync(privatePath)).toBe(true);

    // 验证文件内容格式正确
    const publicContent = fs.readFileSync(publicPath, 'utf8');
    const privateContent = fs.readFileSync(privatePath, 'utf8');
    
    expect(publicContent).toContain('BEGIN');
    expect(publicContent).toContain('END');
    expect(privateContent).toContain('BEGIN');
    expect(privateContent).toContain('END');
  });

  it('should reuse existing AES keys', async () => {
    // 使用 helper 创建测试文件
    const existingKey = 'existing-test-key';
    const existingIv = 'existing-test-iv';
    createTestAesFile(testPemDir, 'test', existingKey, existingIv);

    const plugin = PemInjector({
      pemDir: testPemDir,
      aes: [
        {
          name: 'test',
          options: {
            keySize: 32,
            ivSize: 16,
          },
        },
      ],
    });

    const result = await executeConfigHook(plugin);
    const define = result!.define as Record<string, string>;
    
    // 使用 parseEnvValue 解析环境变量值
    const actualKey = parseEnvValue(define['import.meta.env.VITE_AES_KEY_TEST']);
    const actualIv = parseEnvValue(define['import.meta.env.VITE_AES_IV_TEST']);
    
    expect(actualKey).toBe(existingKey);
    expect(actualIv).toBe(existingIv);
  });

  it('should reuse existing RSA keys', async () => {
    // 使用 helper 创建测试文件
    const publicKey = generateTestPublicKey();
    const privateKey = generateTestPrivateKey();
    createTestRsaFiles(testPemDir, 'test', publicKey, privateKey);

    const plugin = PemInjector({
      pemDir: testPemDir,
      rsa: [
        {
          name: 'test',
          options: {
            modulusLength: 2048,
            publicKeyEncodingType: 'spki',
            privateKeyEncodingType: 'pkcs8',
          },
        },
      ],
    });

    const result = await executeConfigHook(plugin);
    const define = result!.define as Record<string, string>;
    
    // 使用 parseEnvValue 解析环境变量值
    const actualPublicKey = parseEnvValue(define['import.meta.env.VITE_RSA_PUBLIC_KEY_TEST']);
    const actualPrivateKey = parseEnvValue(define['import.meta.env.VITE_RSA_PRIVATE_KEY_TEST']);
    
    // 使用 comparePemContent 比较内容
    expect(comparePemContent(publicKey, actualPublicKey)).toBe(true);
    expect(comparePemContent(privateKey, actualPrivateKey)).toBe(true);
  });

  it('should handle multiple AES configurations', async () => {
    const plugin = PemInjector({
      pemDir: testPemDir,
      aes: [
        {
          name: 'main',
          options: { keySize: 32, ivSize: 16 },
        },
        {
          name: 'sub',
          options: { keySize: 24, ivSize: 16 },
        },
      ],
    });

    const result = await executeConfigHook(plugin);
    const define = result!.define as Record<string, string>;
    
    expect(define['import.meta.env.VITE_AES_KEY_MAIN']).toBeDefined();
    expect(define['import.meta.env.VITE_AES_IV_MAIN']).toBeDefined();
    expect(define['import.meta.env.VITE_AES_KEY_SUB']).toBeDefined();
    expect(define['import.meta.env.VITE_AES_IV_SUB']).toBeDefined();

    // 验证文件生成
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
          },
        },
        {
          name: 'sub',
          options: {
            modulusLength: 2048,
            publicKeyEncodingType: 'pkcs1',
            privateKeyEncodingType: 'pkcs1',
          },
        },
      ],
    });

    const result = await executeConfigHook(plugin);
    const define = result!.define as Record<string, string>;
    
    expect(define['import.meta.env.VITE_RSA_PUBLIC_KEY_MAIN']).toBeDefined();
    expect(define['import.meta.env.VITE_RSA_PRIVATE_KEY_MAIN']).toBeDefined();
    expect(define['import.meta.env.VITE_RSA_PUBLIC_KEY_SUB']).toBeDefined();
    expect(define['import.meta.env.VITE_RSA_PRIVATE_KEY_SUB']).toBeDefined();

    // 验证文件生成
    expect(fs.existsSync(path.join(testPemDir, 'rsa-public-main.pem'))).toBe(true);
    expect(fs.existsSync(path.join(testPemDir, 'rsa-private-main.pem'))).toBe(true);
    expect(fs.existsSync(path.join(testPemDir, 'rsa-public-sub.pem'))).toBe(true);
    expect(fs.existsSync(path.join(testPemDir, 'rsa-private-sub.pem'))).toBe(true);
  });

  it('should inject environment variables on configureServer', () => {
    const plugin = PemInjector({
      pemDir: testPemDir,
      aes: [
        {
          name: 'test',
          options: {
            keySize: 32,
            ivSize: 16,
          },
        },
      ],
    });

    // 执行 configureServer 钩子
    const configureServerHook = plugin.configureServer;
    const serverMock = {} as any;

    if (typeof configureServerHook === 'function') {
      configureServerHook(serverMock);
    } else if (configureServerHook && typeof configureServerHook === 'object' && 'handler' in configureServerHook) {
      configureServerHook.handler(serverMock);
    }

    // 验证环境变量是否被注入
    expect(process.env.VITE_AES_KEY_TEST).toBeDefined();
    expect(process.env.VITE_AES_IV_TEST).toBeDefined();
  });

  it('should handle RSA keys with encryption', async () => {
    const plugin = PemInjector({
      pemDir: testPemDir,
      rsa: [
        {
          name: 'encrypted',
          options: {
            modulusLength: 2048,
            publicKeyEncodingType: 'spki',
            privateKeyEncodingType: 'pkcs8',
            privateKeyCipher: 'aes-256-cbc',
            privateKeyPassphrase: 'test-password',
          },
        },
      ],
    });

    const result = await executeConfigHook(plugin);
    const define = result!.define as Record<string, string>;
    
    expect(define['import.meta.env.VITE_RSA_PUBLIC_KEY_ENCRYPTED']).toBeDefined();
    expect(define['import.meta.env.VITE_RSA_PRIVATE_KEY_ENCRYPTED']).toBeDefined();

    // 验证私钥是否被加密
    const privateKeyContent = parseEnvValue(define['import.meta.env.VITE_RSA_PRIVATE_KEY_ENCRYPTED']);
    expect(privateKeyContent).toContain('ENCRYPTED');
  });

  it('should handle mixed AES and RSA configurations', async () => {
    const plugin = PemInjector({
      pemDir: testPemDir,
      aes: [
        {
          name: 'test',
          options: { keySize: 32, ivSize: 16 },
        },
      ],
      rsa: [
        {
          name: 'test',
          options: {
            modulusLength: 2048,
            publicKeyEncodingType: 'spki',
            privateKeyEncodingType: 'pkcs8',
          },
        },
      ],
    });

    const result = await executeConfigHook(plugin);
    const define = result!.define as Record<string, string>;
    
    // 验证 AES 环境变量
    expect(define['import.meta.env.VITE_AES_KEY_TEST']).toBeDefined();
    expect(define['import.meta.env.VITE_AES_IV_TEST']).toBeDefined();
    
    // 验证 RSA 环境变量
    expect(define['import.meta.env.VITE_RSA_PUBLIC_KEY_TEST']).toBeDefined();
    expect(define['import.meta.env.VITE_RSA_PRIVATE_KEY_TEST']).toBeDefined();
  });
});