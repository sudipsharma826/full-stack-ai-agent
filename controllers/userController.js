import user from "../models/user";
import bcrypt from 'bcrypt';
import jwt, { decode } from 'jsonwebtoken';
import { inngest } from "../inngest/client.js"; // Import inngest client

// SignUp
export const signup = async (req, res) => {
    const { email, password, skills=[] } = req.body;
    try{
        const hashed= await bcrypt.hash(password, 10);
        const userData =await user.create({
            email,
            password: hashed,
            skills,
        })
        
        //Fire inngest event to send the mail with email data
        await inngest.send({
            name : "user/signUp",
            data: {
                email
            }
        });
        
        //Remove password before sending response
        const { password: _, ...userWithoutPassword } = userData.toObject();

        //send jwt token
        const token = jwt.sign({ id: userWithoutPassword._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION  });
        res.status(201).json({
            message: 'User created successfully',
            user: userWithoutPassword,
            token
        });

    }catch (error) {
        console.error("Error in signup controller:", error);

        res.status(500).json({ error: 'Failed to signup', details: error.message });
    }
}

//Login
export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const userData = await user.findOne({ email });
        if (!userData) {
            return res.status(404).json({ error: 'User not found' });
        }
        const isMatch = await bcrypt.compare(password, userData.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        //Remove password before sending response
        const { password: _, ...userWithoutPassword } = userData.toObject();
        //send jwt token
        const token = jwt.sign({ id: userWithoutPassword._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });
        res.status(200).json({
            message: 'Login successful',
            user: userWithoutPassword,
            token
        });
    } catch (error) {
        console.error("Error in login controller:", error);
        res.status(500).json({ error: 'Failed to login', details: error.message });
    }
};

//Logout
export const logout = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        //get data from the token
        const userEmail = jwt.verify(token, process.env.JWT_SECRET,(err,decode) => {
            if (err) {
                return res.status(401).json({ error: 'Invalid token' });
            }
            return decode.email;
        });
        //check if email exists in the database
        const userData = await user.findOne({ email: userEmail });
        if (!userData) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.clearCookie('token');
        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        console.error("Error in logout controller:", error);
        res.status(500).json({ error: 'Failed to logout', details: error.message });
    }
};

//Update user
export const updateUser = async (req, res) => {
    const {skills =[], role,email} = req.body;
    try{
        if(!req.user?.role !== "admin" || !req.user?.id !== "moderator") {
            return res.status(403).json({ error: 'No access to update user' });
        }
        const userData = await user.findOne({ _id: req.user.id , email });
        if (!userData) {
            return res.status(404).json({ error: 'User not found' });
        }
        await user.updateOne({
            _id: userData._id,email: userData.email
        }, {
            $set: {
                skills: skills.length ? skills : userData.skills,
                role
            }
        })
        return res.status(200).json({ message: 'User updated successfully' });
    }catch (error) {
        console.error("Error in updateUser controller:", error);
        res.status(500).json({ error: 'Failed to update user', details: error.message });
    }
}


//Get user
export const getUsers = async (req, res) => {
    try {
        if(!req.user?.role !== "admin" || !req.user?.id !== "moderator") {
            return res.status(403).json({ error: 'No access to update user' });
        }
        const usersData = await user.find().select('-password');
        if (!userData) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(usersData);
    } catch (error) {
        console.error("Error in getUsers controller:", error);
        res.status(500).json({ error: 'Failed to get users', details: error.message });
    }
};