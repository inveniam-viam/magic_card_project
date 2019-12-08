var database = require('./controllers/database');
var db = new database.Database();
var express = require('express');
var app = express();
var session = require('client-sessions');
var bodyParser = require('body-parser');

app.use(express.static("."));
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.listen(8080,function(){
    console.log("Server open on port 8080"); //ensuring that we can connect to the node server
});

app.use(session({
    cookieName: 'session',
    secret: 'asdfghjkl;',
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000,
}))


app.get('/', function (req,res){
    res.write(`<html><body>`);
    if(req.session.msg){
        res.write(req.session.msg);
        delete req.session.msg;
    }   
    res.write(`
        <h1> login/register form </h1>
        <form method=post action='/login'>
        <input type=text name=username>
        <input type=password name=password>
        <input type=submit value=Login>
        </form> <br>
        <form method=post action='/register'>
        <input type=text name=username>
        <input type=password name=password>
        <input type=submit value=Register>
        </form>
        </body>
        </html>`);
    res.end();
});

app.post('/login', function(req, res){
    db.once('loggedin',function(msg){
        if(msg==1){
            req.session.id=req.body.username;
            return res.redirect('/getUsers');
        }
        else {
            req.session.msg = "Invalid login.";
            return res.redirect('/');
        }
    });
    db.login(req.body.username, req.body.password);
});

app.post('/register', function(req, res){
    db.once('register',function(msg){
        if(msg==1){
            req.session.msg = "Registered, please login."
            return res.redirect('/');
        }
        else {
            req.session.msg = "Invalid registration. Try again?"
            return res.redirect('/')
        }
    });
    db.register(req.body.username,req.body.password);
});

app.get('/getUsers', function(req,res){
    if(!req.session.id){
        req.session.msg = 'Not allowed there';
        return res.redirect('/');
    }
    db.once('usertable',function(rows){
        var str = "<table><th>User</th><th>Permissions</th>";
        for (var i=0; i < rows.length; i++)
            str += "<tr><td>"+rows[i].username +
            "</td><td>"+rows[i].type+"</td></tr>";
        str +="</table>";
        str +=`<br>Add User
            <form method=post action='/addUser'>
            Username: <input name=username>
            Password: <input name=pass>
            Type <select> name = accounttype
                <option value=1>User</option>
                <option value=2>Admin</option>
            </select>
            <submit value = 'Add User'>
            </form>
            <form method=post action='/logout'>
            <input type=submit value=Logout>
            </form>
            `;
        res.write('<html><body>'+str+'</body></html>');
        res.end();
    });
    db.getUserTable();
});

app.post('/logout', function (req, res){
    req.session.reset();
    return res.redirect('/');
});
