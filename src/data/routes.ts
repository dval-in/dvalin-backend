import { type Express, type Request, type Response } from 'express'
import { queryGitHubFile } from '../utils/github'
import { Folder } from './fileReference'
import { DataIndex } from './dataIndex'

export class DynamicDataRoute {
  private readonly dataIndex: DataIndex
  private readonly isInitialised: boolean = false

  constructor (private readonly app: Express) {
    this.dataIndex = new DataIndex()
    // this.dataIndex
    //   .initialize()
    //   .then(() => {
    //     console.log('[server] data initialization complete')
    //     this.isInitialised = true
    //   })
    //   .catch((error) => {
    //     console.error('[server] data initialization failed:', error)
    //   })
  }

  setupRoutes (): void {
    this.app.get('/data', async (req: Request, res: Response) => {
      res.json(Folder)
    })
    this.app.get('/data/:dataType/index', async (req: Request, res: Response) => {
      if (!this.isInitialised) {
        return res.status(503).send('Data is not ready yet.')
      }

      const { dataType } = req.params
      if (dataType !== 'Character' && dataType !== 'Weapon') {
        return res.status(400).send('Invalid data type.')
      }
      const index = this.dataIndex.getIndex()
      if (!(dataType in index)) {
        return res.status(404).send('Data type not found.')
      }
      res.json(index[dataType])
    })

    this.app.get('/data/:dataType/:name', async (req: Request, res: Response) => {
      const { dataType, name } = req.params
      const language = typeof req.query.lang === 'string' ? req.query.lang : 'EN'
      try {
        const data = await queryGitHubFile(language, dataType, name)
        res.json(data)
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('does not exist in the data repository')) {
            console.warn('[server] data not found:', dataType, name)
            res.status(404).send('Not found.')
          } else {
            console.error(`[server] data-${dataType} fetch index failed:`, error)
            res.status(500).send('Internal server error.')
          }
        }
      }
    })
  }
}
