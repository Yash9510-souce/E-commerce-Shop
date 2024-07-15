const fs = require('fs');
const path = require('path');

const clearpath = filepath => {
    filepath = path.join(__dirname,'..',filepath)
    fs.unlink(filepath,err => {
        console.log(err);
    });
  }

exports.clearpath = clearpath;