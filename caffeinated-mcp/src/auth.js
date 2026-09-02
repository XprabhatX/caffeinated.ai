import jwt from 'jsonwebtoken';

export const authenticateRequest = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Missing bearer token'
            });
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();
    } catch {
        return res.status(401).json({
            error: 'Invalid or expired token'
        });
    }
};