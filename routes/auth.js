var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');
var template = require('../lib/template.js');

module.exports = function(passport){
    router.get('/login', function(request, response){ 
        var title = 'login';
        var list = template.list(request.list);
        var html = template.html(title, list, `<form action="/auth/login_process" method="post">
            <p><input type="text" name="email" placeholder="email"></p>
            <p>
                <input type="password" name="pwd" placeholder="password"></p>
            </p>
            <p>
                <input type="submit" value="register">
            </p>
        </form>`, '');
        response.send(html);
    })
    
    router.post('/login_process', 
        passport.authenticate('local', { failureRedirect: '/auth/login', failureFlash: true }), (req, res) => {
            req.session.save( () => { res.redirect('/') })
        }
    );

    router.get('/register', function(request, response){ 
        var title = 'login';
        var list = template.list(request.list);
        var html = template.html(title, list, `<form action="/auth/register_process" method="post">
            <p><input type="text" name="email" placeholder="email"></p>
            <p>
                <input type="password" name="pwd" placeholder="password"></p>
            <p>
                <input type="password" name="pwd2" placeholder="password"></p>
            </p>
            <p><input type="text" name="displayName" placeholder="display name"></p>
            <p>
                <input type="submit" value="register">
            </p>
        </form>`, '');
        response.send(html);
    })

    router.post('/register_process', function(request, response){
        var post = request.body;
        var email = post.email;
        var pwd = post.pwd;
        var pwd2 = post.pwd2;
        var displayName = post.displayName;
        var user = {
            email: `${email}`,
            pwd: `${pwd}`,
            displayName: `${displayName}`
        }
        fs.writeFile(`users/${displayName}`, JSON.stringify(user), 'utf8', function(err){
            if (err) console.error(err);
            response.redirect(`/`);
        })
    })
    
    router.get('/logout', function(request, response){
        request.logout();
        request.session.save(function(){
            response.redirect('/');
        })
    })
    
    return router;
}