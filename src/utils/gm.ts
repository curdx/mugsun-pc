// 国密传输：登录/改密/注册前用后端 SM2 公钥加密密码，抓包非明文
import { sm2 } from 'sm-crypto'
import { fetchSm2PublicKey } from '@/api/auth'

let cache: { gmEnabled: boolean; publicKey: string | null } | null = null

/** 取国密配置（公钥 + 开关），进程内缓存 */
async function gmConfig(): Promise<{ gmEnabled: boolean; publicKey: string | null }> {
  if (!cache) {
    cache = await fetchSm2PublicKey()
  }
  return cache
}

/**
 * 加密传输密码：国密开关开启时用 SM2 公钥加密（sm-crypto cipherMode=1 → C1C3C2，与后端 Hutool 配对），
 * 否则原样返回。取公钥失败则降级明文（不阻断登录）。
 */
export async function encryptPassword(pwd: string): Promise<string> {
  try {
    const cfg = await gmConfig()
    if (!cfg.gmEnabled || !cfg.publicKey) {
      return pwd
    }
    return sm2.doEncrypt(pwd, cfg.publicKey, 1)
  } catch {
    return pwd
  }
}
