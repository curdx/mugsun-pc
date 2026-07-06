declare module 'sm-crypto' {
  interface Sm4Options {
    mode?: 'ecb' | 'cbc'
    padding?: 'pkcs#5' | 'pkcs#7' | 'none'
    iv?: string | number[]
    output?: 'string' | 'array'
  }

  export const sm4: {
    encrypt(data: string | number[], key: string | number[], options?: Sm4Options): string
    decrypt(data: string | number[], key: string | number[], options?: Sm4Options): string
  }

  export const sm2: any
  export const sm3: (data: string) => string

  const _default: { sm4: typeof sm4; sm2: typeof sm2; sm3: typeof sm3 }
  export default _default
}
