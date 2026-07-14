# Vite PEM Injector 插件开发助手

## 项目概述

这是一个 Vite 插件，用于自动生成或读取 PEM 密钥文件，并将其注入到环境变量中供应用程序使用。该插件支持 AES 和 RSA 密钥对的生成和管理。

### 项目结构

```
vite-plugin-pem-injector/
├── src/
│   ├── index.ts         # 主插件入口
│   ├── types.ts         # 类型定义
│   ├── aes.ts           # AES 密钥处理逻辑
│   ├── rsa.ts           # RSA 密钥处理逻辑
│   └── utils.ts         # 工具函数
├── tests/               # 测试文件
├── package.json
├── README.md
└── ...
```

### 功能特性

1. 自动生成 AES 和 RSA 密钥对
2. 将密钥持久化存储到 PEM 文件中
3. 通过 `import.meta.env` 注入环境变量
4. 支持多实例配置
5. 开发和构建模式均支持

## 核心实现细节

### 主插件逻辑 (src/index.ts)

主插件实现了 Vite 的 Plugin 接口，主要功能包括：
- 在 config 钩子中处理密钥生成并注入环境变量
- 在 configureServer 钩子中为开发服务器设置环境变量
- 支持静默模式（不输出日志）

### AES 密钥处理 (src/aes.ts)

- 生成随机 AES 密钥和初始化向量 (IV)
- 将密钥信息保存为 JSON 格式的 PEM 文件
- 从现有文件加载密钥（如果存在）
- 生成环境变量名（如 `VITE_AES_KEY_MAIN`）

### RSA 密钥处理 (src/rsa.ts)

- 使用 Node.js crypto 模块生成 RSA 密钥对
- 支持多种编码格式（spki/pkcs1 for 公钥，pkcs8/pkcs1/sec1 for 私钥）
- 支持私钥加密（使用密码）
- 根据构建模式决定是否暴露私钥到环境变量

### 工具函数 (src/utils.ts)

- 文件操作（读写、存在性检查）
- 路径处理
- 环境变量命名规则
- 目录创建

## 类型定义

```typescript
// AES 密钥配置
interface AesOptions {
  keySize?: number;  // 密钥字节数，默认32
  ivSize?: number;   // IV字节数，默认16
}

interface AesConfig {
  name: string;      // 配置名称
  options: AesOptions;
}

// RSA 密钥配置
interface RsaOptions {
  modulusLength?: number;                    // 密钥长度，默认2048
  publicKeyEncodingType?: 'spki' | 'pkcs1'; // 公钥编码类型
  privateKeyEncodingType?: 'pkcs8' | 'pkcs1' | 'sec1'; // 私钥编码类型
  privateKeyCipher?: string;                 // 私钥加密算法
  privateKeyPassphrase?: string;             // 私钥密码
  privateKeyHidden?: boolean;                // 是否隐藏私钥（不注入环境变量）
}

interface RsaConfig {
  name: string;      // 配置名称
  options: RsaOptions;
}

// 插件配置选项
interface PemInjectorOptions {
  pemDir?: string;   // 存储密钥文件目录，默认'./pem'
  aes?: AesConfig[]; // AES密钥配置数组
  rsa?: RsaConfig[]; // RSA密钥配置数组
  silent?: boolean;  // 是否静默模式
}
```

## 使用方式

### 安装

```bash
npm install @whisperer07/vite-plugin-pem-injector
```

### 配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import PemInjector from '@whisperer07/vite-plugin-pem-injector';

export default defineConfig({
  plugins: [
    PemInjector({
      pemDir: './pem', // 密钥存储目录
      aes: [
        {
          name: 'main',
          options: {
            keySize: 32,
            ivSize: 16,
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

### 在应用中使用

```typescript
// 使用 AES 密钥
const aesKey = import.meta.env.VITE_AES_KEY_MAIN;
const aesIv = import.meta.env.VITE_AES_IV_MAIN;

// 使用 RSA 密钥
const rsaPublicKey = import.meta.env.VITE_RSA_PUBLIC_KEY_MAIN;
const rsaPrivateKey = import.meta.env.VITE_RSA_PRIVATE_KEY_MAIN;
```

## 扩展开发指南

### 添加新功能

如果需要扩展插件功能，可以在以下方面进行增强：

1. **支持更多加密算法**：
   - 修改 `types.ts` 添加新算法的类型定义
   - 创建新文件处理新算法的逻辑
   - 在主插件中集成新功能

2. **增强安全性**：
   - 添加密钥轮换机制
   - 实现更安全的存储方式
   - 提供密钥验证功能

3. **改进配置选项**：
   - 添加更多配置参数
   - 支持动态配置
   - 提供更灵活的命名规则

### 测试

运行测试命令：
```bash
npm run test
npm run test:coverage  # 查看覆盖率报告
```

### 构建和发布

```bash
npm run build  # 构建插件
npm publish    # 发布到 npm
```

## 注意事项

1. **安全性**：密钥文件以明文形式存储，请确保不要将其提交到版本控制系统
2. **环境变量**：通过 `import.meta.env` 注入的密钥会在构建时打包到代码中
3. **兼容性**：支持 Vite 3.x、4.x 和 5.x 版本
4. **文件管理**：插件会自动检测并读取现有密钥文件，不会重复生成