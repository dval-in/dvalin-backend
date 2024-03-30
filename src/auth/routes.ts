import passport from 'passport'
import { type Express } from 'express'
import { setupGitHubOAuth } from './githubOAuth'
import expressSession from 'express-session'
import { PrismaSessionStore } from '@quixo3/prisma-session-store'
import { PrismaClient } from '@prisma/client'
import { setupGoogleOAuth } from './googleOAuth'
import { setupMicrosoftOAuth } from './microsoftOAuth'

export class OAuthRoute {
  private readonly config: any
  constructor (private readonly app: Express) {
    this.config = app.get('config')
  }

  setupRoutes (): void {
    this.app.use(
      expressSession({
        cookie: {
          maxAge: 7 * 24 * 60 * 60 * 1000 // ms
        },
        secret: this.config.COOKIE_SECRET,
        resave: true,
        saveUninitialized: true,
        store: new PrismaSessionStore(
          new PrismaClient(),
          {
            checkPeriod: 2 * 60 * 1000, // ms
            dbRecordIdIsSessionId: true,
            dbRecordIdFunction: undefined
          }
        )
      })
    )
    this.app.use(passport.initialize())
    this.app.use(passport.session())
    setupGitHubOAuth(this.app)
    setupGoogleOAuth(this.app)
    setupMicrosoftOAuth(this.app)

    passport.serializeUser((user: any, cb) => {
      process.nextTick(() => {
        console.log('serializing user:', user)
        cb(null, { providerId: user.providerId, name: user.name })
      })
    })

    passport.deserializeUser((user: any, cb) => {
      process.nextTick(() => {
        cb(null, user)
      })
    })
    this.app.get('/session', (req, res) => {
      res.send(req.session)
    })

    this.app.get('/login', (req, res) => {
      res.send({
        providers: ['github', 'google', 'microsoft']
      })
    })

    this.app.get('/logout', (req, res) => {
      req.logout(() => {
        req.session.destroy((err) => {
          if (err) {
            console.error('Session destroy error:', err)
          } else {
            res.redirect('/')
          }
        })
      })
    })
  }
}
