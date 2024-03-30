import axios from 'axios'
import { type Index } from '../types/dataIndex'

export class DataIndex {
  private readonly index: Index = { Character: {}, Weapon: {} }

  async initialize (): Promise<void> {
    await this.fetchData('Character')
    await this.fetchData('Weapon')
  }

  async fetchData (type: 'Character' | 'Weapon'): Promise<void> {
    const url = `https://api.github.com/repos/dval-in/dvalin-data/contents/data/EN/${type}`
    try {
      const response = await axios.get(url)
      const files = response.data
      for (const file of files.filter((f: { name: string }) => f.name !== 'index.json')) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          const fileResponse = await axios.get(file.download_url)
          const data = fileResponse.data
          try {
            this.index[type][file.name.replace('.json', '')] = {
              name: data.name,
              icon: data.pictures.icon,
              rarity: data.rarity
            }
          } catch (error) {
            console.error(`[server] missing field in file: ${file.name}`, error)
          }
        } catch (fileError) {
          console.error(`[server] Failed to fetch ${type} file: ${file.name}`)
        }
      }
    } catch (error) {
      console.error(`[server] Failed to fetch ${type} index: `, error)
    }
  }

  getIndex (): Index {
    return this.index
  }
}
