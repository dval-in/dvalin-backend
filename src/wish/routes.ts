import { type Express, type Request, type Response } from 'express'
import { getGachaConfigList, getWishes } from '../utils/hoyolab'

export class WishHistoryRoute {
  constructor (private readonly app: Express) {
  }

  setupRoutes (): void {
    this.app.get('/wishhistory', async (req: Request, res: Response) => {
      const authkey = typeof req.query.authkey === 'string' ? decodeURIComponent(req.query.authkey) : null
      const maxTime = typeof req.query.maxtime === 'string' ? req.query.maxtime : '2020-09-28 00:00:00'

      if (authkey === null || authkey === '') {
        return res.status(400).send('Missing authkey')
      }

      try {
        const configResponse = await getGachaConfigList(authkey)
        if (configResponse.retcode !== 0 || configResponse.data === null) {
          return res.status(500).send('Failed to fetch gacha configuration list')
        }
        const gachaTypeList = configResponse.data.gacha_type_list
        const wishes = await getWishes(authkey, gachaTypeList, maxTime)
        res.send(wishes)
      } catch (error) {
        console.error(error)
        res.status(500).send('An error occurred while fetching wish history')
      }
    })
  }
}
