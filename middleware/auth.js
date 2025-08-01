import jwt, { decode } from 'jsonwebtoken';


//get the login user data from the token
export const auth = (req,res,next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; 
        next();
    } catch (error) {
        console.error("Error verifying token:", error);
        res.status(401).json({ error: 'Invalid token' });
    }
}

