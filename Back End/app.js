const express = require('express');
const bodyparser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const auth = require('./middlware/auth');
const { clearpath } = require('./util/file');
const { graphqlHTTP } = require('express-graphql')
const app = express();

const graphqlSchema = require('./Graphql/Schema');
const graphqlResolver = require('./Graphql/resolve');

app.use(bodyparser.json());
app.use('/images',express.static(path.join(__dirname,'images')));

app.use( (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'OPTIONS, GET, POST, PUT, PATCH, DELETE'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if(req.method === 'OPTIONS'){
    return res.sendStatus(200);
  }
  next();
});

const fileStorage = multer.diskStorage({
  destination:(req,file,cb) => {
    cb(null,'images')
  },

  filename:(req,file,cb) => {
    cb(null,new Date().getTime() +' - '+ file.originalname)
  }
})

const filefilter = (req,file,cb) => {
  if(file.mimetype === 'images/png' ||
    file.mimetype === 'images/jpg' ||
    file.mimetype === 'images/jpeg' 
  )
  {
    cb(null,true);
  } else {
    cb(null,false);
  }
}

app.use(
  multer({ storage:fileStorage, filefilter:filefilter }).single('image')
)

app.use(auth);

app.put('/post-image', (req,res,next) => {
  if(!req.isAuth){
    const error = new Error('Not Authorized!');
    error.code = 401;
    throw error;
}

  if(!req.file){
    return res.status(200).json({message:'No file Provider'})
  }

  if(req.body.oldPath){
    console.log(req.body.oldPath);
    clearpath(req.body.oldPath);
  }

  return res.status(201).json({
    message:'File Stroed',
    filePath: req.file.path.replace(/\\/g,'/')
  })
})

app.use('/graphql',
  graphqlHTTP({
  schema:graphqlSchema,
  rootValue:graphqlResolver,
  graphiql:true,
  customFormatErrorFn(err){
    if(!err.originalError){
      return err;
    }
    const data = err.originalError.data;
    const message = err.message || 'A Error! Ocured';
    const code = err.originalError.code || 500
    return{
      message:message,
      data:data,
      status:code
    }
  }
}))

app.use((error,req,res,next)=>{
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({
    message:message,
    data:data
  })
})

mongoose.connect('mongodb+srv://yashvekariya9510:YASH9510@product.owbokbk.mongodb.net/Message')
.then(result => {
  console.log('Database Connected!')
  app.listen(8000);
})
.catch(err => {
  console.log(err);
})

