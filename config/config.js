var path = require('path'),
    rootPath = path.normalize(__dirname + '/..'),
    env = process.env.NODE_ENV || 'development';

var config = {
  development: {
    root: rootPath,
    app: {
      name: 'mybolg'
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://admin:admin@localhost/nodeblog'
  },

  test: {
    root: rootPath,
    app: {
      name: 'mybolg'
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://admin:admin@localhost/nodeblog'
  },

  production: {
    root: rootPath,
    app: {
      name: 'mybolg'
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://admin:admin@localhost/nodeblog'
  }
};

module.exports = config[env];
