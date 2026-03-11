require('dotenv').config();
const http = require('http');
const fs = require('fs');
const bcrypt = require('bcrypt');
const express = require('express');
const cookieParser = require('cookie-parser');
const sessions = require('express-session');
const Database = require('./login.contr');
const path = require('path');

const app = express();
const database = new Database();
const port2 = 8080;
const oneDay = 1000 * 60 * 60 * 24;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('view engine', 'ejs');

app.use(sessions({
    secret: 'thisismysecretkey123',
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false
}));

app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});

app.get('/', (req, res) => {
    if (req.session.userid) {
        res.redirect('/bank');
    } else {
        res.render('index');
    }
});

app.get('/login', (req, res) => {
    res.render('login2');
});

app.get('/signup', (req, res) => {
    res.render('signup2');
});

app.post('/loginUser', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const user = await database.findUser(username);

    if (!user.detected) {
        res.status(404).send('User not found');
        return;
    } else {
        const creds = await database.select(username);
        const hashedPassword = creds.password;

        if (await bcrypt.compare(password, hashedPassword)) {
            const account = await database.getAccount(creds.userid);
            req.session.userid = creds.userid;
            req.session.username = creds.username;
            req.session.savings = account.savings;
            res.status(300).send();
        } else {
            res.status(403).send('Invalid password');
            return;
        }
    }
});

app.post('/signupUser', async (req, res) => {
    const parcel = req.body;
    const cred = await database.findUser(parcel.username);

    if (cred.detected) {
        res.status(404).send('User already exists');
    } else {
        bcrypt.hash(parcel.password, 10)
            .then((hash) => {
                database.insert(parcel.username, hash);
            }).catch((error) => {
                res.status(404).send();
                return;
            });
        res.status(300).send();
    }
});

app.get('/logout', async (req, res) => {
    if (req.session && req.session.userid) {
        try {
            await database.updateAccount(req.session.userid, req.session.savings);
        } catch (err) {
            console.log(err);
        }
    }
    req.session.destroy(() => {
        res.redirect('/');
    });
});

app.get('/bank', (req, res) => {
    if (!req.session.userid) {
        res.redirect('/login');
        return;
    }
    res.render('bank', { session: req.session });
});

app.get('/getSession', (req, res) => {
    res.json({
        username: req.session.username,
        userid: req.session.userid,
        savings: parseFloat(req.session.savings) || 0
    });
});

app.post('/updateSession', (req, res) => {
    const newAmount = parseFloat(req.body.currentAmount);
    if (isNaN(newAmount)) {
        return res.status(400).send('Invalid amount');
    }
    req.session.savings = newAmount;
    res.status(200).send('New amount transmitted');
});

app.listen(port2, function(error) {
    if (error) {
        console.log(error);
    } else {
        console.log('Listening to port: ' + port2);
    }
});