import express from "express";
import passport from "passport";

import "../../service/oauthService.mjs";


const router = express.Router();

router.get('/gitlab', (req, res) => {
    res.set('HX-Redirect', "auth/gitlab/oauth");
    res.status(200).end();
});


router.get("/gitlab/oauth", passport.authenticate("gitlab", {
    scope: ['api read_api read_user read_repository write_repository']
}));

router.get("/gitlab/callback", passport.authenticate("gitlab", {
    successRedirect: "/projects/gitlab/all?render=full",
    failureRedirect: "/failure",
}));

export default router;
