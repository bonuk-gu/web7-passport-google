var express = require('express');
var router = express.Router();
var fs = require('fs');
var template = require('../lib/template.js');
var shortid = require('shortid');

module.exports = function(passport){
    router.get('/login', function(request, response){ 
        var title = 'login';
        var body = `
            <form action="/auth/login_process" method="post">
                <p><input type="text" name="email" placeholder="email"></p>
                <p>
                    <input type="password" name="pwd" placeholder="password"></p>
                </p>
                <p>
                    <input type="submit" value="register">
                </p>
            </form>
        `;
        var list = template.list(request.list);
        var html = template.html(title, list, body, '', '');
        response.send(html);
    })
    
    router.post('/login_process', 
        passport.authenticate('local', { failureRedirect: '/auth/login', failureFlash: true }), (req, res) => {
            req.session.save( () => { res.redirect('/') })
        }
    );

    router.get('/register', function(request, response){
        var title = 'register';
        var body = `
            <form action="/auth/register_process" method="post">
                <p><input type="text" name="email" placeholder="email"></p>
                <p><input type="password" name="pwd" placeholder="password"></p>
                <p><input type="password" name="pwd2" placeholder="password"></p>
                <p><input type="text" name="displayName" placeholder="display name"></p>
                <p><input type="submit" value="register"></p>
            </form>
        `;
        var list = template.list(request.list);
        var html = template.html(title, list, body, '', '');
        response.send(html);
    })

    router.post('/register_process', function(request, response){
        var post = request.body;
        var email = post.email;
        var pwd = post.pwd;
        var pwd2 = post.pwd2;
        var displayName = post.displayName;

        if(pwd !== pwd2){
            console.log('password');
            response.redirect('/auth/register');
        } else {
            /*
            var user = db.get('users').find({
                email: email
            }).values9) 
            */
            var user = {
                id: shortid.generate(),
                email: email,
                password: pwd,
                displayName: displayName
            }
            fs.writeFileSync(`users/${displayName}`, JSON.stringify(user), 'utf8', function(err){
                if (err) console.error(err);
            })
            request.login(user, function(err){
                console.log('redirect');
                request.session.save(function(){
                    response.redirect('/');
                })
                //return response.redirect(`/`);
            })
        }   
    })
    
    router.get('/logout', function(request, response){
        request.logout();
        request.session.save(function(){
            response.redirect('/');
        })
    })
    
    return router;
}