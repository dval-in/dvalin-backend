import { Strategy as MicrosoftStrategy } from 'passport-microsoft'
import { getEnvVar } from '../utils/envVariableValidation'
import { createUser, getUserFromProvider } from '../db/utils'
import { type Express } from 'express'
import passport from 'passport'

const setupMicrosoftOAuth = (app: Express): void => {
  app.get('/auth/microsoft', passport.authenticate('microsoft'))

  app.get('/auth/microsoft/callback', passport.authenticate('microsoft', { failureRedirect: '/login' }), (req, res) => {
    res.redirect('/')
  })
  passport.use(new MicrosoftStrategy({
    clientID: getEnvVar('MICROSOFT_CLIENT_ID'),
    clientSecret: getEnvVar('MICROSOFT_CLIENT_SECRET'),
    callbackURL: '/auth/microsoft/callback',
    scope: ['user.read']
  }, async (accessToken: any, refreshToken: any, profile: any, cb: any) => {
    console.log('profile:', profile)
    const email = profile.emails?.[0].value
    console.log('email:', email)
    let user = await getUserFromProvider(profile.id)
    if (user == null) {
      user = await createUser(profile.id, profile.displayName, email)
    }
    cb(null, user)
  }
  ))
}

export { setupMicrosoftOAuth }
