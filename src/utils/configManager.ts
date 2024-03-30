import dotenv from 'dotenv'

dotenv.config()

class ConfigManager {
  [key: string]: string;
  constructor () {
    for (const key of Object.keys(process.env)) {
      Object.defineProperty(this, key, {
        value: process.env[key],
        writable: false,
        enumerable: true
      })
    }
    Object.freeze(this)
    console.log('ConfigManager initialized')
  }
}

export { ConfigManager }
