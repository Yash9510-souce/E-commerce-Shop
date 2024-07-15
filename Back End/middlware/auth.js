const jwt = require('jsonwebtoken');

module.exports = (req,res,next) => {
    const authHeader = req.get('Authorization');

    if(!authHeader){
        req.isAuth = false
        return next();
    }

    const token = authHeader.split(' ')[1];
    let decodetoken;
    try{
        decodetoken = jwt.verify(token,'somesupersecretsecret');
    } catch(err){
        req.isAuth = false
        return next();
    }

    if(!decodetoken){
        req.isAuth = false
        return next();
    }

    req.userId = decodetoken.userId
    req.isAuth = true
    next();
}

