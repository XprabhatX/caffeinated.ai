import crypto from 'crypto';

export const syncAuth = (req, res, next) => {
    const expectedKey = process.env.MODEL_SYNC_KEY;
    const providedKey = req.get('X-SYNC-KEY');

    if (!expectedKey) {
        console.error('MODEL_SYNC_KEY is not configured');
        return res.status(500).json({
            message: 'Sync authentication is not configured'
        });
    }

    if (!providedKey) {
        return res.status(401).json({
            message: 'Unauthorized'
        });
    }

    const expected = Buffer.from(expectedKey);
    const provided = Buffer.from(providedKey);

    if (
        expected.length !== provided.length ||
        !crypto.timingSafeEqual(expected, provided)
    ) {
        return res.status(401).json({
            message: 'Unauthorized'
        });
    }

    next();
};