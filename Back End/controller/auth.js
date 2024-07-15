const { validationResult } = require('express-validator');
const User = require('../model/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.getSignup = async (req,res,next) => {
    const errors = validationResult(req)

    if(!errors.isEmpty()){
        const error = new Error('Validation failed!');
        error.statusCode = 422;
        error.data = errors.array()
        throw error;
    }

    try {
    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;

    const haspss = await bcrypt.hash(password,12)
        const user = new User({
            email:email,
            password:haspss,
            name:name
        })
    const result = await user.save();

        res.status(201).json({
            message:'User Created!',
            userId:result._id
        })
    } catch (err) {
        if(!err.statusCode){
            err.statusCode = 500;
        }        
        next(err);
    }
}

exports.postlogin = async (req,res,next) => {
    const email = req.body.email;
    const password = req.body.password;

    try{
    const user = await User.findOne({ email:email })
        if(!user){
            const error = new Error('Email not found!');
            error.statusCode = 401;
            throw error;
        }

    const isEqual = await bcrypt.compare(password,user.password);
        if(!isEqual){
            const error = new Error('Email or password are not Equal');
            error.statusCode = 401;
            throw error;
        }

        const token = jwt.sign({
            email:user.email,
            userId:user._id.toString()
        },
        'someusersigninscret',
        { expiresIn:'1h' }
       )
       res.status(200).json({
        token:token,
        userId:user._id.toString()
       })
    } catch(err) {
        if(!err.statusCode){
            err.statusCode = 500;
        }        
        next(err);
    }
}

exports.getUserstatus = async (req,res,next) => {
    try{
    const user = await User.findById(req.userId)
        if(!user){
            const error = new Error('User not Found!');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({
            message:"User Fetched!!",
            status:user.status
        })
    } catch (err) {
        if(!err.statusCode){
            err.statusCode = 500;
        }        
        next(err);
    }
} 

exports.getPoststatus = async (req,res,next) => {
    const newStatus = req.body.status;
    try{
    const user = await User.findById(req.userId)
        if(!user){
            const error = new Error('User not Found!');
            error.statusCode = 404;
            throw error;
        }

        user.status = newStatus;
        await user.save();

        res.status(200).json({
            message:"User status Updated!",
        })
    } catch(err) {
        if(!err.statusCode){
            err.statusCode = 500;
        }        
        next(err);
    }
} 