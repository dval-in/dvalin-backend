import { Strategy as GitHubStrategy } from 'passport-github'
import { getEnvVar } from '../utils/envVariableValidation'
import { createUser, getUserFromProvider } from '../db/utils'
import { type Express } from 'express'
import passport from 'passport'

const setupGitHubOAuth = (app: Express): void => {
  app.get('/auth/github', passport.authenticate('github'))

  app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), (req, res) => {
    res.redirect('/')
  })
  passport.use(new GitHubStrategy({
    clientID: getEnvVar('GITHUB_CLIENT_ID'),
    clientSecret: getEnvVar('GITHUB_CLIENT_SECRET'),
    callbackURL: '/auth/github/callback'
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

export { setupGitHubOAuth }
