export const isLoggedIn = (req, res, next) => {
    req.user ? next() : res.redirect("/");
};
