const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const app = express();
const port = 3000;

mongoose.connect('mongodb://127.0.0.1:27017/user', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: Number,
    password: String
});

const User = mongoose.model('User', userSchema);


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'your_secret_key',
    resave: true,
    saveUninitialized: true
}));

app.get('/', (req, res) => {
    if(req.session.userId){
        return res.render('signup-success');
    }
    res.redirect('/login');
});

app.get('/login', (req, res) => {
    if(req.session.userId){
        return res.redirect('/signup-success');
    }
    res.render('login',{error:req.query.error});
});
app.get('/signup', (req, res) => {
    res.render('signup');
});

app.post('/signup', async (req, res) => {
    try {
        const newUser = new User({
            name: req.body.username,
            email: req.body.email,
            phone: req.body.phone,
            password: req.body.password
        });
        await newUser.save();

        req.session.userId = newUser._id;

        res.render('signup-success', { user: newUser });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email, password });

        if (!user) {
            return res.render('login', { error: 'Invalid email or password' });
        }
        req.session.userId = user._id;

        res.redirect('/signup-success');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/signup-success', async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.redirect('/login');
        }

        res.render('signup-success', { user });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/delete', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.redirect('/login');
        }

        const userId = req.body.userId;
        await User.findByIdAndDelete(userId);

        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
                return res.status(500).send('Internal Server Error');
            }
            res.redirect('/login');
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
app.get('/edit/:userId', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.redirect('/');
        }
        const userId = req.params.userId;
        
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).send('User not found');
        }
        res.render('edit', { user });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
app.post('/edit/:userId', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.redirect('/');
        }
        const userId = req.params.userId;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).send('User not found');
        }
        user.name = req.body.username;
        user.email = req.body.email;
        user.phone = req.body.phone;
        user.password = req.body.password;

        await user.save();
        res.render('signup-success', { user });

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Internal Server Error');
        }
        res.redirect('/');
    });
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});


