export const verifyToken = (req, res, next) => {
    const token = req.headers['x-gitlab-token'];

    const expectedToken = process.env.GITLAB_WEBHOOK_SECRET;

    if (token && token === expectedToken) {
        next();
    } else {
        res.status(401).send('Unauthorized: Invalid token');
    }
};
