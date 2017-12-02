var passport = require('passport');
var LocalStrategy = require('passport-local');
var mongoose = require('mongoose'),
    User = mongoose.model('User');

module.exports.init = function () {
    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
    }, function (email, password, done) {
        User.findOne({ email: email}, function(err, user) {
            if (err) { 
                return done(err); 
            }
            if (!user) { 
                return done(null, false); 
            }
            if (!user.verifyPassword(password)) { 
                return done(null, false); 
            } 

            return done(null, user);
        });
    }));

    passport.serializeUser(function(user, done) {
        done(null, user._id)
    });

    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });
};