const User = require('../model/user');
const Post = require('../model/post');
const { clearpath } = require('../util/file');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
module.exports = {
    createUser: async function({ userInput },req ){

        const errors = [];
        if(!validator.isEmail(userInput.email)){
            errors.push({message:'Invalid Email-Id!'});
        }
        if(validator.isEmpty(userInput.password) || 
         !validator.isLength(userInput.password, { min:5 } )){
            errors.push({message:'Password Length Minimum 5'});
        }
        if(errors.length > 0){
            const error = new Error('Invalid Input!')
            error.data = errors;
            error.code = 422;
            throw error;
        }
        
        const exstingUser = await User.findOne({ email:userInput.email })
        if(exstingUser){
            const error = new Error('User are Alredy Exits!');
            throw error;
        }
        const hasspass = await bcrypt.hash(userInput.password,12);
        const user = new User({
            email:userInput.email,
            name:userInput.name,
            password:hasspass
        })

        const createUser = await user.save();

        return{
            ...createUser._doc,
            _id:createUser._id.toString()
        }
    },
    login: async function({ email,password }){
        const user = await User.findOne({ email:email })
        if(!user){
            const error = new Error('User Not Found!');
            error.code = 401
            throw error;
        }

        const isEqual = await bcrypt.compare(password,user.password)
        if(!isEqual){
            const error = new Error('Not Match!');
            error.code = 401
            throw error;
        }

        const token = jwt.sign(
        {
            userId:user._id.toString(),
            email:user.email
        },
        'somesupersecretsecret',
        { expiresIn: '1h' }
       );

        return{
            token: token,
            userId: user._id.toString()
        };
    },
    createPost: async function({ postInput },req ){
        if(!req.isAuth){
            const error = new Error('Not Authorized!');
            error.code = 401;
            throw error;
        }

        const errors = [];
        if(validator.isEmpty(postInput.title) || !validator.isLength(postInput.title, { min:5 })){
            errors.push({message:'Title Length Minimum 5!'});
        }
        if(validator.isEmpty(postInput.content) || !validator.isLength(postInput.content,{ min:5 })){
            errors.push({message:'Content Length Minimum 5'});
        }
        if(errors.length > 0){
            const error = new Error('Invalid Input!')
            error.data = errors;
            error.code = 422;
            throw error;
        }

        const user = await User.findById(req.userId);
        if(!user){
            const error = new Error('Not User Found!');
            error.code = 401;
            throw error;
        }

        const post = new Post({
            title:postInput.title,
            content:postInput.content,
            imageUrl:postInput.imageUrl,
            creator:user
        })

        const createPost = await post.save();
           user.posts.push(createPost);
           await user.save();
        return{
            ...createPost._doc,
            _id:createPost._id.toString(),
            createdAt:createPost.createdAt.getTime(),
            updatedAt:createPost.updatedAt.getTime()
        }
    },
    posts: async function({page},req) {
        if(!req.isAuth){
            const error = new Error('Not Authorized!');
            error.code = 401;
            throw error;
        }

        if(!page){
            page=1
        }

        const perPage = 2;

        const totalPosts = await Post.find().countDocuments()
        const posts = await Post.find()
              .sort({ createdAt:- 1 })
              .skip((page - 1) * perPage)
              .limit(perPage)
              .populate('creator')

        return {
            posts:posts.map(p => {
                return {
                    ...p._doc,
                    _id:p._id.toString(),
                    createdAt:p.createdAt.getTime(),
                    updatedAt:p.updatedAt.getTime()
                }
            }),
            totalPosts:totalPosts
        }
    },
    post: async function({id},req){
        if(!req.isAuth){
            const error = new Error('Not Authorized!');
            error.code = 401;
            throw error;
        }

        const post = await Post.findById(id).populate('creator')

        if(!post){
            const error = new Error('Not Post Found!');
            error.code = 401;
            throw error;
        }
         return {
            ...post._doc,
            _id:post._id.toString(),
            createdAt:post.createdAt.getTime(),
            updatedAt:post.updatedAt.getTime()
         }
    },
    updatePost: async function({ id,postInput },req){
        if(!req.isAuth){
            const error = new Error('Not Authorized!');
            error.code = 401;
            throw error;
        }

        const post = await Post.findById(id).populate('creator')

        if(!post){
            const error = new Error('Not Post Found!');
            error.code = 404;
            throw error;
        }

        if(post.creator._id.toString() !== req.userId){
            const error = new Error('Not Authorized Matched!');
            error.code = 403;
            throw error;
        }

        const errors = [];
        if(validator.isEmpty(postInput.title) || !validator.isLength(postInput.title, { min:5 })){
            errors.push({message:'Title Length Minimum 5!'});
        }
        if(validator.isEmpty(postInput.content) || !validator.isLength(postInput.content,{ min:5 })){
            errors.push({message:'Content Length Minimum 5'});
        }
        if(errors.length > 0){
            const error = new Error('Invalid Input!')
            error.data = errors;
            error.code = 422;
            throw error;
        }
 
        post.title = postInput.title
        post.content = postInput.content
        if(post.imageUrl !== 'undefined'){
            post.imageUrl = postInput.imageUrl
        }

        const updatePost = await post.save();

        return {
            ...updatePost._doc,
            _id:updatePost._id.toString(),
            createdAt:updatePost.createdAt.getTime(),
            updatedAt:updatePost.updatedAt.getTime()
         }
    },
    deletePost: async function({ id },req) {
        if(!req.isAuth){
            const error = new Error('Not Authorized!');
            error.code = 401;
            throw error;
        }

        const post = await Post.findById(id);

        if(!post){
            const error = new Error('Not Post Found!');
            error.code = 404;
            throw error;
        }

        if(post.creator.toString() !== req.userId){
            const error = new Error('Not Authorized Matched!');
            error.code = 403;
            throw error;
        }

        clearpath(post.imageUrl);
        await Post.findByIdAndDelete(id);
        const user = await User.findById(req.userId)
        user.posts.pull(id)
        await user.save();
        return true;
    },
    user: async function(args,req){
        if(!req.isAuth){
            const error = new Error('Not Authorized!');
            error.code = 401;
            throw error;
        }

        const user = await User.findById(req.userId);

        if(!user){
            const error = new Error('Not User Found!');
            error.code = 401;
            throw error;
        }

        return {
            ...user._doc,
            _id:user._id.toString()
        }
    },
    updateStatus: async function({ status },req) {
        if(!req.isAuth){
            const error = new Error('Not Authorized!');
            error.code = 401;
            throw error;
        }

        const user = await User.findById(req.userId);

        if(!user){
            const error = new Error('Not User Found!');
            error.code = 401;
            throw error;
        }

        user.status = status
        await user.save();

        return {
            ...user._doc,
            _id:user._id.toString()
        }
    }
}