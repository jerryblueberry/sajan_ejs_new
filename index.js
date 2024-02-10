const express = require('express');
const cors = require('cors');
const connectDb = require('./db/database');
const user = require('./routes/userRoute');
const product = require('./routes/productRoute');
const order = require('./routes/orderRoutes');
const cart = require('./routes/cartRoute');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser')
const session = require('express-session');
const { verifyAuth } = require('./middleware/authentication');
const jwt = require('jsonwebtoken');
// Enable CORS
app.use(cors());
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(session({
    secret: 'MXIUuw6u5Ty0Ecih3XCjZ1+0575N2OTu0x9gsOl6pBc=',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set secure to true if using HTTPS
}));
require('dotenv').config();
// app.use("/files", express.static(path.join(__dirname, "files")));
app.use("/files", express.static(path.join(__dirname, "files")));

const PORT = process.env.PORT || 3000;



app.use('/', user);
app.use('/products', product);
app.use('/carts', cart);
app.use('/orders', order);

app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});




// for the views
app.get('/signup', (req, res) => {
    res.render('signup');
});
app.get('/products', (req,res) => {

    res.render('products');
})
app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/logout', verifyAuth, (req, res) => {
    // Set the JWT cookie's expiration time to a past date
    res.cookie('jwt', '', { expires: new Date(0) });
    
    // Remove the req.user object
    delete req.user;

  
    
    // Redirect the user to the login page
    res.redirect('/login');
});
app.get('/', (req, res) => {
    const token = req.cookies.jwt;
    const decoded = jwt.verify(token, 'MXIUuw6u5Ty0Ecih3XCjZ1+0575N2OTu0x9gsOl6pBc=');
    const userName = decoded.userName;

    


    res.render('home',{userName});
   
});
app.get('/navbar',verifyAuth,(req,res) => {
    const userId = req.user._id;
    res.render('navbar',{userId});
})

app.get('/add',(req,res) => {
    res.render("addproduct");
})
app.get('/products/detail/', (req, res) => {
    res.render('productdetail', { userId: req.params.userId, productId: req.params.productId });
});
app.get('/carts/:userId',(req,res) => {
    res.render('cart');
})
app.get('/orders',(req,res) => {
    res.render('order');
})


app.listen(PORT, () => {
    console.log(`Listening on Port ${PORT}`);
    connectDb();
});
