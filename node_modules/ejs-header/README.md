# ejs-header

An EJS header template with login, signup, and forgot email functions

This module extends your Express app with routes and templates needed to quickly add login functionality to your app.

 - requires EJS
 - requires you use Passport.JS and Express Session
 
 How to use:
 
 ```
 npm install --save ejs-header
 ```
 In your server.js or app.js:
 ```
app.title = "YOUR_PROJECT_NAME";
app.social = false;
app.use('/users', express.static(__dirname + '/public'));
require('ejs-header')(app,session,passport);
 ```
 In your own templates
 ```
<%- include ../node_modules/ejs-header/views/partials/header.ejs %>
 ```
 
 The .ejs partial for the header requires a 'title' property inputed from all your server routes. This autogenerates the title shown on the header. For example:
 
 ```
 		res.render('index.ejs', {
			title : app.title,
 ```
 You can define ```app.title``` in ```server.js/index.js``` or in ```package.json``` and require it.
 
 ### You can generate a project using Slush using this header with https://github.com/vtange/slush-ejs-barebones
 
