import jwt from 'jsonwebtoken';
import user from '../models/user.js';

//get the login user data from the token
export const auth = async (req,res,next) => {
    const token = req.headers.authorization?.split(" ")[1] || req.cookies?.token;

    
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        
        // Get full user data from database
        const userData = await user.findById(decoded.id).select('-password');
        if (!userData) {
            return res.status(401).json({ error: 'User not found' });
        }
        
        req.user = {
            _id: userData._id,
            id: userData._id,
            email: userData.email,
            role: userData.role,
            skills: userData.skills
        };
        
        next();
    } catch (error) {
        console.error("Error verifying token:", error);
        res.status(401).json({ error: 'Invalid token' });
    }
}

