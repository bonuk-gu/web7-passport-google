module.exports = function(app){
    var dbConnection = require('../db_info.js');
    var dbconn = dbConnection.init();

    var passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy,
    GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

    app.use(passport.initialize());
    app.use(passport.session());
    
    // 로그인 성공시 passport.use에서 done의 두 번재 인자가 serializeUser의 콜백 함수의 첫번째 인자로
    // serializeUser 로그인이 성공했을 시 성공한 사실을 session-file-store에 저장하는 기능, 로그인에 성공하면 딱 한번 실행
    passport.serializeUser(function(user, done) {
        console.log('serializeUser', user);
        done(null, user);
    });
    
    // 로그인에 성공한 후 각각의 페이지에 방문할 때 마다 로그인한 사용자인지 아닌지에 대한 체크를 하는 기능
    passport.deserializeUser(function(user, done) {
        console.log('deserializeUser', user);
        done(null, user); // done의 두 번째 인자에 있는 데이터가 request의 'user' 객체로 전달되도록 되어 있음
    });
    
    passport.use(new LocalStrategy(
        {
            usernameField: 'email',
            passwordField: 'pwd',  
        },
        function(email, password, done) {
            dbConnection.dbopen(dbconn);
            dbconn.query(`select * from users where email='${email}'`, (err, results, fields) => {
                if(err) {
                    console.log(err);
                } else {
                    var user = results[0];
                    if(user) {
                        if(user.pwd === password) {
                            return done(null, user);
                        } else {
                            return done(null, false, {
                                message: 'Incorrect password'
                            })
                        }
                    } else {
                        return done(null, false, {
                            message: 'Incorrect username'
                        })
                    }
                }
            })
        }
    ));

    var googleCredentials = require('../config/google.json');
    passport.use(new GoogleStrategy({
        clientID: googleCredentials.web.client_id,
        clientSecret: googleCredentials.web.client_secret,
        callbackURL: googleCredentials.web.redirect_uris[0]
      },
      function(token, tokenSecret, profile, done) {
        console.log('GoogleStrategy', token, tokenSecret, profile)
        // token = accessToken, tokenSecret = RefreshToken
        var email = profile.emails[0].value;
        var user;
        dbconn.query(`select * from users where email='${email}'`, (err, row, fields) => {
            if(err) { 
                console.log(err); 
            } 
            else {
                if (row[0]) {
                    dbconn.query(`update users set google_id='${profile.id}' where email='${email}'`, (err, row, fields) => {
                        if (err) { console.log(err); }
                    });
                    user = {
                        email: row[0].email,
                        pwd: row[0].pwd,
                        displayname: row[0].displayname
                    }
                    console.log('exist in db:', user);
                    done(null, user);
                } else {
                    console.log('not in db');
                    dbconn.query(`insert into users (email, pwd, displayname, google_id) values ('${profile.emails[0].value}', '1111', '${profile.displayName}', '${profile.id}')`, (err, row, fields) => {
                        if (err) { console.log(err); }
                    });
                    user = {
                        email: profile.emails[0].value,
                        pwd: 1111,
                        displayname: profile.displayName
                    }
                    console.log(user);
                    done(null, user);
                }
            }
         })
      }
    ));
    
    app.get('/auth/google', passport.authenticate('google', {
        scope: ['https://www.googleapis.com/auth/plus.login', 'email']
    }));

    app.get('/auth/google/callback', passport.authenticate('google', {
        failureRedirect: '/auth/login'
    }),
    function (req, res) {
        req.session.save( () => { res.redirect('/') });
    })

    return passport;
}
