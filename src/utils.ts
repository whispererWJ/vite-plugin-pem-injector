import fs from 'fs';
import path from 'path';

/**
 * 确保目录存在，如果不存在则创建
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * 读取PEM文件内容
 */
export function readPemFile<T>(filePath: string): T | null {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content) as T;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 写入PEM文件
 */
export function writePemFile<T>(filePath: string, data: T): void {
  const content = JSON.stringify(data, null, 2);
  fs.writeFileSync(filePath, content, 'utf8');
}

/**
 * 读取文本文件
 */
export function readTextFile(filePath: string): string | null {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 写入文本文件
 */
export function writeTextFile(filePath: string, content: string): void {
  fs.writeFileSync(filePath, content, 'utf8');
}

/**
 * 生成环境变量名
 */
export function getEnvVarName(prefix: string, name: string, suffix: string): string {
  return `${prefix}_${name.toUpperCase()}${suffix}`;
}

/**
 * 生成文件名
 */
export function getFileName(type: string, name: string, ext: string = 'pem'): string {
  return `${type}-${name}.${ext}`;
}

/**
 * 检查文件是否存在
 */
export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * 获取文件路径
 */
export function resolvePath(basePath: string, ...segments: string[]): string {
  return path.resolve(basePath, ...segments);
}