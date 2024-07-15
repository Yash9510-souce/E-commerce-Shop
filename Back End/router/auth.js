const express = require('express');
const { body } = require('express-validator');
const authController = require('../controller/auth');
const isAuth = require('../middlware/is-auth');
const User = require('../model/user');

const router = express.Router();

router.put('/signup',[
    body('email')
    .isEmail()
    .withMessage('Please Enter Valid Email')
    .custom((value, { req }) => {
        return User.findOne({email:value})
        .then(userdoc => {
            if(userdoc){
                return Promise.reject('E-Mail Address Alredy Registered!');
            }
        })
    })
    .normalizeEmail(),
    body('password').trim().isLength({min:5}),
    body('name').trim().not().isEmpty()
],authController.getSignup);

router.post('/login',authController.postlogin);

router.get('/status',isAuth,authController.getUserstatus);

router.patch('/status',isAuth,[
    body('status')
    .trim()
    .not()
    .isEmpty()
],authController.getPoststatus)

module.exports = router;