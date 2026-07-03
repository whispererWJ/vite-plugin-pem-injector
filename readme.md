# @whisperer/vite-plugin-pem-injector

> Vite 插件 - 自动生成或读取 PEM 密钥文件，并注入到环境变量中

[![npm version](https://badge.fury.io/js/@whisperer%2Fvite-plugin-pem-injector.svg)](https://badge.fury.io/js/@whisperer%2Fvite-plugin-pem-injector)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vite](https://img.shields.io/badge/Vite-^3.0.0%20%7C%7C%20^4.0.0%20%7C%7C%20^5.0.0-blueviolet)](https://vitejs.dev/)

## 📦 特性

- 🔐 **自动生成密钥** - 支持 AES 和 RSA 密钥对的自动生成
- 💾 **持久化存储** - 密钥文件存储在指定目录，支持复用
- 🌐 **环境变量注入** - 通过 `import.meta.env` 在应用中使用密钥
- 🛠 **TypeScript 支持** - 完整的类型定义
- 🔄 **多实例支持** - 支持配置多组密钥
- 🚀 **开发友好** - 开发和构建模式均支持
- 📁 **文件管理** - 自动检测并读取或生成密钥文件

## 📋 前置要求

- Node.js >= 16.0.0
- Vite >= 3.0.0

## 🔧 安装

```bash
npm install @whisperer/vite-plugin-pem-injector
# 或
yarn add @whisperer/vite-plugin-pem-injector
# 或
pnpm add @whisperer/vite-plugin-pem-injector
```

## 🚀 快速开始

### 1. 在 Vite 配置中使用

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import PemInjector from '@whisperer/vite-plugin-pem-injector';

export default defineConfig({
  plugins: [
    PemInjector({
      pemDir: './pem', // 密钥存储目录
      aes: [
        {
          name: 'main',
          options: {
            keySize: 32, // AES密钥字节数
            ivSize: 16,  // IV字节数
          },
        },
      ],
      rsa: [
        {
          name: 'main',
          options: {
            modulusLength: 2048,
            publicKeyEncodingType: 'spki',
            privateKeyEncodingType: 'pkcs8',
          },
        },
      ],
    }),
  ],
});
```

### 2. 在应用中使用

```typescript
// 使用 AES 密钥
const aesKey = import.meta.env.VITE_AES_KEY_MAIN;
const aesIv = import.meta.env.VITE_AES_IV_MAIN;

// 使用 RSA 密钥
const rsaPublicKey = import.meta.env.VITE_RSA_PUBLIC_KEY_MAIN;
const rsaPrivateKey = import.meta.env.VITE_RSA_PRIVATE_KEY_MAIN;
```

## 📚 API 文档

### PemInjector(options)

#### 配置选项

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `pemDir` | `string` | `'./pem'` | 密钥文件存储目录（相对于项目根目录） |
| `aes` | `AesConfig[]` | `[]` | AES 密钥配置数组 |
| `rsa` | `RsaConfig[]` | `[]` | RSA 密钥配置数组 |

#### AesConfig

| 参数 | 类型 | 描述 |
|------|------|------|
| `name` | `string` | 配置名称，用于生成环境变量名和文件名 |
| `options` | `AesOptions` | AES 配置选项 |

#### AesOptions

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `keySize` | `number` | `32` | 密钥字节数（16=128位，24=192位，32=256位） |
| `ivSize` | `number` | `16` | 初始化向量字节数（通常为16） |

#### RsaConfig

| 参数 | 类型 | 描述 |
|------|------|------|
| `name` | `string` | 配置名称，用于生成环境变量名和文件名 |
| `options` | `RsaOptions` | RSA 配置选项 |

#### RsaOptions

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `modulusLength` | `number` | `2048` | RSA 密钥长度（位） |
| `publicKeyEncodingType` | `'spki' \| 'pkcs1'` | `'spki'` | 公钥编码类型 |
| `privateKeyEncodingType` | `'pkcs8' \| 'pkcs1' \| 'sec1'` | `'pkcs8'` | 私钥编码类型 |
| `privateKeyCipher` | `string` | `undefined` | 私钥加密算法（如 'aes-256-cbc'） |
| `privateKeyPassphrase` | `string` | `undefined` | 私钥密码 |

## 💡 使用示例

### 基础示例：生成 AES 密钥

```typescript
// vite.config.ts
import PemInjector from '@whisperer/vite-plugin-pem-injector';

export default {
  plugins: [
    PemInjector({
      pemDir: './keys',
      aes: [
        {
          name: 'encryption',
          options: {
            keySize: 32,
            ivSize: 16,
          },
        },
      ],
    }),
  ],
};
```

```typescript
// app.ts
const key = import.meta.env.VITE_AES_KEY_ENCRYPTION;
const iv = import.meta.env.VITE_AES_IV_ENCRYPTION;
```

### 高级示例：多组密钥配置

```typescript
// vite.config.ts
import PemInjector from '@whisperer/vite-plugin-pem-injector';

export default {
  plugins: [
    PemInjector({
      pemDir: './pem',
      aes: [
        {
          name: 'main',
          options: { keySize: 32, ivSize: 16 },
        },
        {
          name: 'backup',
          options: { keySize: 24, ivSize: 16 },
        },
      ],
      rsa: [
        {
          name: 'production',
          options: {
            modulusLength: 4096,
            publicKeyEncodingType: 'spki',
            privateKeyEncodingType: 'pkcs8',
            privateKeyCipher: 'aes-256-cbc',
            privateKeyPassphrase: 'secure-password',
          },
        },
        {
          name: 'development',
          options: {
            modulusLength: 2048,
            publicKeyEncodingType: 'pkcs1',
            privateKeyEncodingType: 'pkcs1',
          },
        },
      ],
    }),
  ],
};
```

### 使用加密的 RSA 私钥

```typescript
// 配置加密的 RSA 私钥
PemInjector({
  rsa: [
    {
      name: 'secure',
      options: {
        modulusLength: 2048,
        privateKeyCipher: 'aes-256-cbc',
        privateKeyPassphrase: 'your-secure-passphrase',
      },
    },
  ],
});
```

### 在 Vue 组件中使用

```vue
<template>
  <div>
    <p>AES Key: {{ aesKey }}</p>
    <p>RSA Public Key: {{ rsaPublicKey }}</p>
  </div>
</template>

<script setup lang="ts">
const aesKey = import.meta.env.VITE_AES_KEY_MAIN;
const rsaPublicKey = import.meta.env.VITE_RSA_PUBLIC_KEY_MAIN;
</script>
```

## 📁 生成的文件结构

插件会在 `pemDir` 目录下生成以下文件：

```
pem/
├── aes-main.pem           # AES 密钥（JSON 格式）
├── aes-sub.pem            # AES 密钥（JSON 格式）
├── rsa-public-main.pem    # RSA 公钥（PEM 格式）
├── rsa-private-main.pem   # RSA 私钥（PEM 格式）
├── rsa-public-sub.pem     # RSA 公钥（PEM 格式）
└── rsa-private-sub.pem    # RSA 私钥（PEM 格式）
```

### AES 文件内容示例

```json
{
  "key": "xK8fG5hJ2mP9vN4wR7tY3bE6qA1dC0fG=",
  "iv": "L2mP9vN4wR7tY3bE"
}
```

## 🔒 安全性说明

1. **密钥存储**：密钥文件以明文形式存储在项目目录中，请确保：
   - 不要将密钥文件提交到版本控制系统
   - 将 `pem/` 目录添加到 `.gitignore`
   - 在生产环境中使用环境变量或密钥管理服务

2. **环境变量**：通过 `import.meta.env` 注入的密钥会在构建时被打包到代码中
   - 对于敏感密钥，建议仅在服务端使用
   - 注意控制环境变量的访问权限

3. **RSA 私钥加密**：支持使用密码加密私钥文件，提供额外的安全性

## 🎯 环境变量命名规范

### AES 密钥
```
VITE_AES_KEY_{NAME}    # AES 密钥
VITE_AES_IV_{NAME}     # AES 初始化向量
```

### RSA 密钥
```
VITE_RSA_PUBLIC_KEY_{NAME}   # RSA 公钥
VITE_RSA_PRIVATE_KEY_{NAME}  # RSA 私钥
```

其中 `{NAME}` 为配置中的 `name` 参数的大写形式。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 本地开发

```bash
# 克隆项目
git clone https://github.com/yourusername/vite-plugin-pem-injector.git

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 运行测试
npm run test

# 代码检查
npm run lint
```

## 📄 许可证

[MIT](LICENSE) © 2024 Your Name

## 🔗 相关链接

- [Vite 插件开发指南](https://vitejs.dev/guide/api-plugin.html)
- [Node.js Crypto 文档](https://nodejs.org/api/crypto.html)
- [PEM 格式说明](https://www.rfc-editor.org/rfc/rfc7468)

## ❓ 常见问题

### 密钥文件已存在，插件会覆盖吗？

不会。如果密钥文件已存在，插件会读取并使用现有密钥，不会重新生成。

### 可以在生产环境中使用吗？

可以，但请注意：
1. 确保密钥文件不会被泄露
2. 考虑使用环境变量或密钥管理服务
3. 敏感密钥建议仅在服务端使用

### 如何更新已生成的密钥？

删除对应的 PEM 文件，重启开发服务器或重新构建，插件会自动生成新的密钥。

### 支持其他加密算法吗？

目前支持 AES 和 RSA。如有其他算法需求，欢迎提交 Issue。

### 与 Vite 版本兼容性？

支持 Vite 3.x、4.x 和 5.x 版本。

## 📝 更新日志

### v1.0.0
- 🎉 首次发布
- ✨ 支持 AES 密钥生成和管理
- ✨ 支持 RSA 密钥对生成和管理
- ✨ 环境变量自动注入
- ✨ TypeScript 类型支持
- 📝 完整的文档和示例