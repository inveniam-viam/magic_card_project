var database = require('./controllers/database');
var db = new database()
var app = require('express')
var session = require('client-sessions');

app.get('/', function (req,res){
    res.write(`<html><body>`);
    if(req.session.msg){
        res.write(req.session.msg);
        delete req.session.msg;
    }
    res.write(`
        <form method=post action='/login'>
        <input type=text name=username>
        <input type=password name=password>
        input type=submit value=Login>
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

app.get('/getUsers', function(req,res){
    if(!req.session.id){
        req.session.msg = 'Not allowd there';
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
            </form>`;
        res.write('<html><body>'+str+'</body></html>');
        res.end();
    });
    db.getUserTable();
});

app.get('/logout', function (req, res){
    req.session.reset();
    res.session.msg = 'You logged out';
    return res.redirect('/');
});
