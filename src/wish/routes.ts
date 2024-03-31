import { type Express, type Request, type Response } from 'express'
import { wishHistoryQueue } from './wishHistoryQueue' // Adjust the path as necessary
declare module 'express-session' {
  interface Session {
    passport: { user: { providerId: string, name: string } }
  }
}

export class WishHistoryRoute {
  constructor (private readonly app: Express) {}

  setupRoutes (): void {
    this.app.get('/wishhistory', async (req: Request, res: Response) => {
      const authkey = typeof req.query.authkey === 'string' ? decodeURIComponent(req.query.authkey) : null
      const uid = typeof req.query.uid === 'string' ? decodeURIComponent(req.query.uid) : null
      if (authkey === null || authkey === '') {
        return res.status(400).send('Missing authkey')
      }
      const providerId = req.session.passport.user.providerId
      const job = await wishHistoryQueue.add({ authkey, providerId, uid })
      res.json({ jobId: job.id, message: 'Your request is being processed. Please check back later for the results.' })
    })
  }
}
