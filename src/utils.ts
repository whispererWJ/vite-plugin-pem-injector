// src/utils.ts
import fs from 'fs';
import path from 'path';

export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function readPemFile<T>(filePath: string): T | null {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content) as T;
    }
    return null;
  } catch (error) {
    console.warn(`Failed to read PEM file: ${filePath}`, error);
    return null;
  }
}

export function writePemFile<T>(filePath: string, data: T): void {
  try {
    const content = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, content, 'utf8');
  } catch (error) {
    console.error(`Failed to write PEM file: ${filePath}`, error);
    throw error;
  }
}

export function readTextFile(filePath: string): string | null {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
    return null;
  } catch (error) {
    console.warn(`Failed to read text file: ${filePath}`, error);
    return null;
  }
}

export function writeTextFile(filePath: string, content: string): void {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
  } catch (error) {
    console.error(`Failed to write text file: ${filePath}`, error);
    throw error;
  }
}

export function getEnvVarName(prefix: string, name: string, suffix: string): string {
  return `${prefix}_${name.toUpperCase()}${suffix}`;
}

export function getFileName(type: string, name: string, ext: string = 'pem'): string {
  return `${type}-${name}.${ext}`;
}

export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

export function resolvePath(basePath: string, ...segments: string[]): string {
  return path.resolve(basePath, ...segments);
}
