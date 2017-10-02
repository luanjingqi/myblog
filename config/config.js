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
    db: 'mongodb://localhost/mybolg-development'
  },

  test: {
    root: rootPath,
    app: {
      name: 'mybolg'
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://localhost/mybolg-test'
  },

  production: {
    root: rootPath,
    app: {
      name: 'mybolg'
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://localhost/mybolg-production'
  }
};

module.exports = config[env];
