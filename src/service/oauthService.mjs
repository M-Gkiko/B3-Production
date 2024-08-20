import passport from "passport";
import {Strategy as GitLabStrategy} from "passport-gitlab2";
import {config} from "dotenv";

config()

const { PORT, GITLAB_APP_ID, GITLAB_APP_SECRET, GITLAB_CALLBACK_URL, GITLAB_BASE_URL } = process.env;
export let loggedUserDisplayName = ''
export let loggedUserId = ''


passport.use(
    new GitLabStrategy(
        {
            clientID: GITLAB_APP_ID,
            clientSecret: GITLAB_APP_SECRET,
            callbackURL: GITLAB_CALLBACK_URL,
            baseURL: GITLAB_BASE_URL,
        },
        async function (accessToken, refreshToken, profile, cb) {

            profile.gitlabAccessToken = accessToken;
            profile.baseURL = GITLAB_BASE_URL
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
