import passport from "passport";
import {Strategy as GitLabStrategy} from "passport-gitlab2";
import {config} from "dotenv";

config()

const { PORT, GITLAB_APP_ID, GITLAB_APP_SECRET } = process.env;
export let loggedUserDisplayName = ''
export let loggedUserId = ''


passport.use(
    new GitLabStrategy(
        {
            clientID: GITLAB_APP_ID,
            clientSecret: GITLAB_APP_SECRET,
            callbackURL: "http://localhost:8000/auth/gitlab/callback",
            baseURL: "https://gitlab.lnu.se/",
        },
        async function (accessToken, refreshToken, profile, cb) {

            profile.gitlabAccessToken = accessToken;
            profile.baseURL = "https://gitlab.lnu.se/";
            loggedUserId = profile.id
            loggedUserDisplayName = profile.displayName;

            return cb(null, profile);
        }
    )
);
passport.serializeUser(function (user, cb) {
    cb(null, user);
});
passport.deserializeUser(function (user, cb) {
    cb(null, user);
});
