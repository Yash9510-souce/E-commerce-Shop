const express = require('express');
const feedController = require('../controller/feed');
const isAuth = require('../middlware/is-auth');
const { body } = require('express-validator');
const router = express.Router()

router.get('/posts',isAuth,feedController.getPost)

router.post('/post',isAuth,[
    body('title')
    .trim()
    .isLength({min:5}),
    body('content')
    .trim()
    .isLength({min:5})
],feedController.createPost);

router.get('/post/:postId',isAuth,[
    body('title')
    .trim()
    .isLength({min:5}),
    body('content')
    .trim()
    .isLength({min:5})
],feedController.getpost);

router.put('/post/:postId',isAuth,feedController.updatePost);

router.delete('/post/:postId',isAuth,feedController.deletepost);

module.exports = router;