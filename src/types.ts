/**
 * AES密钥配置选项
 */
export interface AesOptions {
  /** 密钥的字节数，默认32 */
  keySize?: number;
  /** IV的字节数，默认16 */
  ivSize?: number;
}

/**
 * AES密钥配置
 */
export interface AesConfig {
  /** 配置名称，用于生成环境变量名和文件名 */
  name: string;
  /** AES选项 */
  options: AesOptions;
}

/**
 * RSA公钥编码类型
 */
export type RsaPublicKeyEncodingType = 'spki' | 'pkcs1';

/**
 * RSA私钥编码类型
 */
export type RsaPrivateKeyEncodingType = 'pkcs8' | 'pkcs1' | 'sec1';

/**
 * RSA密钥配置选项
 */
export interface RsaOptions {
  /** RSA密钥长度，默认2048 */
  modulusLength?: number;
  /** 公钥编码类型，默认'spki' */
  publicKeyEncodingType?: RsaPublicKeyEncodingType;
  /** 私钥编码类型，默认'pkcs8' */
  privateKeyEncodingType?: RsaPrivateKeyEncodingType;
  /** 私钥加密算法 */
  privateKeyCipher?: string;
  /** 私钥密码 */
  privateKeyPassphrase?: string;
  /** 
   * 是否隐藏私钥（不注入到环境变量）
   * - dev 模式默认: false (注入)
   * - build 模式默认: true (隐藏)
   */
  privateKeyHidden?: boolean;
}

/**
 * RSA密钥配置
 */
export interface RsaConfig {
  /** 配置名称，用于生成环境变量名和文件名 */
  name: string;
  /** RSA选项 */
  options: RsaOptions;
}

/**
 * 插件配置选项
 */
export interface PemInjectorOptions {
  /** 存储密钥文件目录(以根目录为基准)，默认'./pem' */
  pemDir?: string;
  /** AES密钥配置数组 */
  aes?: AesConfig[];
  /** RSA密钥配置数组 */
  rsa?: RsaConfig[];
}

/**
 * 环境变量对象
 */
export type EnvVars = Record<string, string>;

/**
 * PEM文件内容结构（用于AES）
 */
export interface AesPemContent {
  key: string;
  iv: string;
}