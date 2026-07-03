// tests/helpers.ts
import type { Plugin, UserConfig, ConfigEnv } from 'vite';
import fs from 'fs';
import path from 'path';

/**
 * 执行插件的 config 钩子
 */
export async function executeConfigHook(
  plugin: Plugin,
  config: UserConfig = {},
  env: ConfigEnv = { command: 'build', mode: 'production' }
): Promise<any> {
  const configHook = plugin.config;

  if (!configHook) {
    return null;
  }

  // 如果是函数形式
  if (typeof configHook === 'function') {
    return await configHook(config, env);
  }

  // 如果是对象形式（包含 handler）
  if (typeof configHook === 'object' && 'handler' in configHook) {
    return await configHook.handler(config, env);
  }

  return null;
}

/**
 * 执行插件的 configureServer 钩子
 */
export function executeConfigureServer(plugin: Plugin, server: any = {}): void {
  const configureServerHook = plugin.configureServer;

  if (!configureServerHook) {
    return;
  }

  // 如果是函数形式
  if (typeof configureServerHook === 'function') {
    configureServerHook(server);
    return;
  }

  // 如果是对象形式（包含 handler）
  if (typeof configureServerHook === 'object' && 'handler' in configureServerHook) {
    configureServerHook.handler(server);
    return;
  }
}

/**
 * 从 config 钩子结果中提取 define 对象
 */
export function getDefineFromConfig(result: any): Record<string, string> {
  if (!result || typeof result !== 'object') {
    return {};
  }
  return result.define || {};
}

/**
 * 标准化换行符（处理 Windows/Linux/Mac 的换行符差异）
 */
export function normalizeNewlines(str: string): string {
  return str.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

/**
 * 比较 PEM 内容（忽略换行符差异和首尾空格）
 */
export function comparePemContent(expected: string, actual: string): boolean {
  const normalizedExpected = normalizeNewlines(expected).trim();
  const normalizedActual = normalizeNewlines(actual).trim();
  return normalizedExpected === normalizedActual;
}

/**
 * 解析环境变量值（处理 JSON.stringify）
 */
export function parseEnvValue(value: string): any {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/**
 * 生成测试用的 RSA 公钥
 */
export function generateTestPublicKey(): string {
  return `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu1SU1LfVLPHCYZM6YgF3
t3G8xX9H5K6L7M8N9O0P1Q2R3S4T5U6V7W8X9Y0Z1a2b3c4d5e6f7g8h9i0j1k2l3
m4n5o6p7q8r9s0t1u2v3w4x5y6z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P3Q4R5S
-----END PUBLIC KEY-----`;
}

/**
 * 生成测试用的 RSA 私钥
 */
export function generateTestPrivateKey(): string {
  return `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cJh
kzpiAXe3cbzFfkfko7svw/8v/R4uB8z8CxG5L6M7N8O9P0Q1R2S3T4U5V6W7X8Y9Z0
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6A7B8C9D0E1F2G
3H4I5J6K7L8M9N0O1P2Q3R4S5T6U7V8W9X0Y1Z2a3b4c5d6e7f8g9h0i1j2k3l4
-----END PRIVATE KEY-----`;
}

/**
 * 创建测试目录
 */
export function createTestDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * 清理测试目录
 */
export function cleanupTestDir(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

/**
 * 创建测试用的 AES 密钥文件
 */
export function createTestAesFile(dirPath: string, name: string, key: string, iv: string): void {
  const filePath = path.join(dirPath, `aes-${name}.pem`);
  createTestDir(dirPath);
  fs.writeFileSync(filePath, JSON.stringify({ key, iv }, null, 2));
}

/**
 * 创建测试用的 RSA 密钥文件
 */
export function createTestRsaFiles(dirPath: string, name: string, publicKey: string, privateKey: string): void {
  createTestDir(dirPath);
  fs.writeFileSync(path.join(dirPath, `rsa-public-${name}.pem`), publicKey);
  fs.writeFileSync(path.join(dirPath, `rsa-private-${name}.pem`), privateKey);
}