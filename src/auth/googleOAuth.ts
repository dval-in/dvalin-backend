import { createUser, getUserFromProvider } from '../db/utils'
import { type Express } from 'express'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'

const setupGoogleOAuth = (app: Express): void => {
  const config = app.get('config')
  app.get('/auth/google', passport.authenticate('google'))

  app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    res.redirect('/')
  })
  passport.use(new GoogleStrategy({
    clientID: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback',
    scope: ['profile', 'email']
  }, async (accessToken, refreshToken, profile, cb) => {
    const email = profile.emails?.[0].value
    let user = await getUserFromProvider(profile.id)
    if (user == null) {
      user = await createUser(profile.id, profile.displayName, email)
    }
    cb(null, user)
  }
  ))
}

export { setupGoogleOAuth }
