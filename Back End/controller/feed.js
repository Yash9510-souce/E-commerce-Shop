const { validationResult } = require('express-validator');
const Post = require('../model/post');
const User = require('../model/user');
const io = require('../socket');
const path = require('path');
const fs = require('fs');

exports.getPost = async (req,res,next) => {
    const currentPage = req.query.page || 1;
    const perPage = 2;
    try{
    const count = await Post.find().countDocuments()
    const posts = await Post.find()
    .populate('creator')
    .skip((currentPage - 1) * perPage)
    .limit(perPage);
        res.status(200).json({
            message:'Post Fetched to Database',
            posts:posts,
            totalItems:count
        })
    } catch(err) {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    }
   
}

exports.createPost = async (req,res,next) => {
    const errors = validationResult(req)

    if(!errors.isEmpty()){
        const error = new Error('Validation failed!');
        error.statusCode = 422;
        throw error;
    }

    if (!req.file){
        const error = new Error('No any image!');
        error.statusCode = 422;
        throw error;
    }

    const title = req.body.title;
    const content = req.body.content;
    const imageUrl = req.file.path.replace("\\" ,"/");
    try{
    const post = new Post({
        title:title,
        content:content,
        imageUrl:imageUrl,
        creator:req.userId
    })

   await  post.save();
    const user = await User.findById(req.userId);
        user.posts.push(post)
    await user.save();
    io.getIO().emit('posts', {
        action: 'create',
        post: { ...post._doc, creator: { _id: req.userId, name: user.name } }
      });
        res.status(201).json({
            message:'Post created successfully',
            post:post,
            creator:{ _id: user._id , name: user.name}
         })
    } catch (err) {
        if(!err.statusCode){
            err.statusCode = 500;
        }        
        next(err);
    }
}

exports.getpost = async (req,res,next) => {
    const postId = req.params.postId;

    try {
    const post = await Post.findById(postId)
        if(!post) {
            const error = new Error('Not Any Post in database');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({
            message:'Post Fethed!',
            post:post
         })
    } catch(err) {
        if(!err.statusCode){
            err.statusCode = 500;
        }        
        next(err);
    }
}

exports.updatePost = async (req,res,next) => {
    const postId = req.params.postId;

    const errors = validationResult(req)
    if(!errors.isEmpty()){
        const error = new Error('Validation failed!');
        error.statusCode = 422;
        throw error;
    }

    try{ 
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;
    if (req.file){
        imageUrl = req.file.path.replace("\\" ,"/");
    }

    if (!imageUrl){
        const error = new Error('No imageUrl!');
        error.statusCode = 422;
        throw error;
    }
    

    const post = await Post.findById(postId).populate('creator')
        if(!post) {
            const error = new Error('Not Any Post in database');
            error.statusCode = 404;
            throw error;
        }

        if (post.creator._id.toString() !== req.userId){
            const error = new Error('Not Authorized');
            error.statusCode = 403;
            throw error;
        }

        if(imageUrl !== post.imageUrl){
            clearpath(post.imageUrl);
        }

        post.title = title;
        post.content = content;
        post.imageUrl = imageUrl;

    const result = await post.save();
    io.getIO().emit('posts', {
        action: 'update',
        post: result
      });
        res.status(200).json({
            message:'Post Updated successfully!',
            post:result
         })
    } catch(err) {
        if(!err.statusCode){
            err.statusCode = 500;
        }        
        next(err);
    }
}

const clearpath = filepath => {
    filepath = path.join(__dirname,'..',filepath)
    fs.unlink(filepath,err => {
        console.log(err);
    });
}

exports.deletepost = async (req,res,next) => {
    const postId = req.params.postId;
    
    try{
    const post = await Post.findById(postId);
        if(!post) {
            const error = new Error('Not Any Post in database');
            error.statusCode = 404;
            throw error;
        }

        if (post.creator.toString() !== req.userId){
            const error = new Error('Not Authorized');
            error.statusCode = 403;
            throw error;
        }

        clearpath(post.imageUrl)
        await Post.findOneAndDelete(postId);
    
    const user = await User.findById(req.userId);

    user.posts.pull(postId);
    const result = await user.save();
    io.getIO().emit('posts', {
        action: 'delete',
        post: postId
      });
    res.status(200).json({
        message:'Post Deleted successfully!',
        post:result
    })
    } catch(err) {
        if(!err.statusCode){
            err.statusCode = 500;
        }        
        next(err);
    }
}