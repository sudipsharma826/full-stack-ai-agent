import user from "../models/user.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import inngest from "../inngest/client.js";

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
        console.log("User created:", userData._id);
        console.log("Sending Inngest event for user signup:", email);
        
        //Fire inngest event to send the mail with email data
        await inngest.send({
            name : "user/signUp",
            data: {
                email
            }
        });
        console.log("Inngest event sent successfully for user signup:", email);
        
        //Remove password before sending response
        const { password: _, ...userWithoutPassword } = userData.toObject();

        //send jwt token
        const token = jwt.sign({ 
            id: userWithoutPassword._id,
            email: userWithoutPassword.email,
            role: userWithoutPassword.role 
        }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION  });
        
        // Set token in cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        
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
        const token = jwt.sign({ 
            id: userWithoutPassword._id,
            email: userWithoutPassword.email,
            role: userWithoutPassword.role 
        }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });
        
        // Set token in cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        
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
        res.clearCookie('token');
        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        console.error("Error in logout controller:", error);
        res.status(500).json({ error: 'Failed to logout', details: error.message });
    }
};

//Update user - Only admins can update user data
export const updateUser = async (req, res) => {
    const {skills =[], role, email} = req.body;
    try{
        // Only admins can update user data
        if(req.user?.role !== "admin") {
            return res.status(403).json({ error: 'Access denied. Only admins can update user data.' });
        }
        
        const targetUser = await user.findOne({ email });
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const updateData = {};
        if (skills.length > 0) updateData.skills = skills;
        if (role && ['user', 'moderator', 'admin'].includes(role)) updateData.role = role;
        
        await user.updateOne({
            _id: targetUser._id
        }, {
            $set: updateData
        });
        
        return res.status(200).json({ message: 'User updated successfully' });
    }catch (error) {
        console.error("Error in updateUser controller:", error);
        res.status(500).json({ error: 'Failed to update user', details: error.message });
    }
}

//Get user by email - Only admins can access
export const getUserByEmail = async (req, res) => {
    try {
        // Only admins can get user data
        if(req.user?.role !== "admin") {
            return res.status(403).json({ error: 'Access denied. Only admins can access user data.' });
        }
        
        const { email } = req.params;
        const userData = await user.findOne({ email }).select('-password');
        
        if (!userData) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.status(200).json(userData);
    } catch (error) {
        console.error("Error in getUserByEmail controller:", error);
        res.status(500).json({ error: 'Failed to get user', details: error.message });
    }
};

//Get users - Only admins can view all users
export const getUsers = async (req, res) => {
    try {
        // Only admins can view all users
        if(req.user?.role !== "admin") {
            return res.status(403).json({ error: 'Access denied. Only admins can view all users.' });
        }
        
        const usersData = await user.find().select('-password');
        if (!usersData) {
            return res.status(404).json({ error: 'No users found' });
        }
        res.status(200).json(usersData);
    } catch (error) {
        console.error("Error in getUsers controller:", error);
        res.status(500).json({ error: 'Failed to get users', details: error.message });
    }
};