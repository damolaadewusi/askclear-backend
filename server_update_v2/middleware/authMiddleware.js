import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
    let token = req.headers.authorization;
    if (token && token.startsWith('Bearer')) {
        try {
            token = token.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'askclear_demo_secret_99');
            req.user = decoded; // { id: <int> }
            next();
        } catch (error) {
            return res.status(401).json({ success: false, error: 'Unauthorized Session' });
        }
    } else {
        return res.status(401).json({ success: false, error: 'No Auth Token Validated' });
    }
};
