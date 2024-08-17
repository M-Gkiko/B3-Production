import DOMPurify from 'isomorphic-dompurify';

export const sanitizeBody = (req, res, next) => {
    for (const key in req.body) {
        if (Object.hasOwnProperty.call(req.body, key)) {
            req.body[key] = DOMPurify.sanitize(req.body[key]);
        }
    }
    next();
};
