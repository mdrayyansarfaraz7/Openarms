const express = require('express');
const path = require('path');
const app = express();
const mongoose = require('mongoose');
const User = require('./models/users.js');
const Pet = require('./models/pet.js');
const session = require('express-session');
const passport = require('passport');
const localStrategy = require('passport-local');
let {isLoggedIn}=require('./middleware.js');
const engine = require('ejs-mate');
require('dotenv').config();
const Request = require('./models/Request'); 
const ExpressError = require('./utils/ExpressError');
const multer = require('multer');
const {storage}=require('./cloudConfig.js');
const upload = multer({ storage })
const methodOverride = require('method-override');
const reviews = require('./models/reviews.js');
const MongoStore=require('connect-mongo');

app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

const mongoURL=process.env.MONGO_ATLAS_URL;

const store=MongoStore.create({
    mongoUrl:mongoURL,
    crypto:{
        secret:process.env.SECRET,
    },
    touchAfter:24*60*60
})

store.on("error",()=>{
    console.log("error in express sessions:",err)
})

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000
    }
};



mongoose.connect(mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(() => {
    console.log("DB Connected!");
  }).catch(err => {
    console.log("DB Connection Error:", err);
  });


mongoose.set('debug', true);

app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Middleware to set res.locals.currentUser
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
});

let port = 8080;

// All pets for adoption
app.get('/adopt', async (req, res,next) => {
    try{
        let allPetsForAdoption = await Pet.find({ listingType: 'Adopt' });
        res.render('Pets', { pets: allPetsForAdoption,title:"Pets for Adoption",rout:"adopt" });
    }catch(err){
        next(err)
    }
    
});

// All pets for sale
app.get('/buyAPet', async (req, res,next) => {
    try{
        let allPetsForSale = await Pet.find({ listingType: 'Sale' });
        res.render('Pets', { pets: allPetsForSale,title:"Pets for Sale",rout:"buyAPet" });
    }catch(err){
        next(err)
    }

});

//Filterpet
app.get('/adopt/category/:category',async(req,res,next)=>{
    try{
        let{category}=req.params;
        let allPetsForAdoption = await Pet.find({ listingType: 'Adopt', species: category });
        res.render('Pets', { pets: allPetsForAdoption,title:"Pets for Adoption",rout:"adopt" });
    }catch(err){
        next(err)
    }
   
});
app.get('/buyAPet/category/:category',async(req,res,next)=>{
    try{
        let{category}=req.params;
        let allPetsForSale = await Pet.find({ listingType: 'Sale', species: category });
        res.render('Pets', { pets: allPetsForSale,title:"Pets for Sale",rout:"buyAPet" });
    }catch(err){
        next(err)
    }
    
});

// Put a pet for adoption or sale
app.get('/putUpAPet',isLoggedIn, (req, res,next) => {
    try{
        res.render('addingAPet');
    }catch(err){
        next(err)
    }
    
});



// Adding a new Pet
app.post('/putUpAPet',upload.single('image'),isLoggedIn,async (req, res,next) => {
    try{
        const newPet = new Pet(req.body);
    let direction = newPet.listingType;
    newPet.Owner = req.user._id;
    newPet.image = { url: req.file.path };
    console.log('image url:',req.file.path);
    console.log(newPet.Owner);
    await newPet.save();
        let userId=req.user._id;
        const user = await User.findById(userId);
        user.Pets.push(newPet._id);
        await user.save();
    if (direction == 'Adopt') {
        res.redirect('/adopt');
    } else {
        res.redirect('/buyAPet');
    }
    }catch(err){
        next(err)
    }
});

// Registration
app.get('/register', (req, res,next) => {
    try{
        res.render('register');
    }catch(err){
        next(err)
    }
    
});

app.get('/profile', isLoggedIn,(req, res,next) => {
    try{
    res.render('profile', { user: req.user });
    }catch(err){
        next(err)
    }
});

app.post('/register', async (req, res, next) => {
    try {
        const { email, username, password } = req.body;
        const user = new User({ email, username });
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            res.redirect('/profile');
        });
    } catch (e) {
        res.redirect('/register');
    }
});
//Complete Profile
app.post('/profile', async (req, res,next) => {
    try{

    
    const { contactInfo, country, city, address } = req.body;
    const user = await User.findById(req.user._id);
    user.ContactInfo = contactInfo;
    user.Country = country;
    user.City = city;
    user.Address = address;
    await user.save();
    console.log(user);
    res.redirect('/');
    }catch(err){
        next(err)
    }
});

// Login
app.get('/login', (req, res) => {
    try{
    res.render('login');
    }catch(err){
        next(err);
    }
});

app.post('/login', passport.authenticate("local", {
    failureRedirect: '/login'
}), (req, res) => {
    res.redirect('/');
});

app.get('/logout',(req,res)=>{
    req.logout(
        (err)=>{
            if(err){
                console.log(err);
            }
            res.redirect('/');
        }
    )
});

//My Profile
app.get('/MyProfile',isLoggedIn,async(req,res,next)=>{
    try{
        const user = await User.findById(req.user._id)
        .populate('Pets')
        .populate({
            path: 'requestsForYou',
            populate: { path: 'from to pet' }
        })
        .populate({
            path: 'yourRequests',
            populate: { path: 'from to pet' }
        });
         res.render('MyProfile', { user });
    }catch(err){
        next(err);
    }
  
});
//Edit User
app.get('/edit/:id', isLoggedIn,async (req, res,next) => {
    try{
        let { id } = req.params; 
        let EditUser=await User.findById(id);
        res.render('edit', { user: EditUser });
    }catch(err){
        next(err);
    }
    

});
//Update User

app.put('/update/:id', isLoggedIn, async (req, res,next) => {
    const { id } = req.params;
    const { email, contactInfo, country, city, address } = req.body;

    try {
        const updatedUser = await User.findByIdAndUpdate(id, {
            email,
            ContactInfo: contactInfo,
            Country: country,
            City: city,
            Address: address
        }, { new: true });

        if (!updatedUser) {
            return res.status(404).send('User not found');
        }

        return res.redirect('/'); 
    } catch (error) {
       next(error)
    }
});
//indivPet
app.get('/pets/:id',async(req,res,next)=>{
    try{
        const { id } = req.params;
        let pet=await Pet.findById(id).populate('Owner');
        res.render('indivPets',{petDetails:pet});
    } catch (error) {
       next(error)
    }
   
})
//destroyPet
app.delete('/pets/:id/:petId',async(req,res,next)=>{
    try{
        const {id,petId}=req.params;
        await User.findByIdAndUpdate(id,{ $pull: { Pets: petId }});
        await Pet.findByIdAndDelete(petId);
        await Request.deleteMany({ pet: petId });
    res.redirect('/');
    }catch (error) {
        next(error)
     }
    
})
//Pet Request
app.post('/requests',async(req,res,next)=>{
    try{
        let {reason,from,to,pet}=req.body;

        let newRequest=new Request({reason,from,to,pet});
        let savedRequest=await newRequest.save();
    
        await User.findByIdAndUpdate(from,{ $push: { yourRequests: savedRequest._id }})
        await User.findByIdAndUpdate(to,{ $push: { requestsForYou: savedRequest._id }})
        res.redirect('/MyProfile');

    }catch (error) {
        next(error)
     }
});

//Show approval Form
app.get('/approve/:reqId', isLoggedIn, async (req, res,next) => {
    try{
        const { reqId} = req.params;
        const request = await Request.findById(reqId).populate('pet');
        res.render('approve', {request});
    }catch(error){
        next(error)
    }
    
});
app.post('/approve/:reqId',async(req,res)=>{
    try{
        let {reqId}=req.params;
        let petReq=await Request.findById(reqId);
        let CurrentOwnerId=petReq.to.toString();
        let petId=petReq.pet.toString();
        let CurrentOwner=await User.findById(CurrentOwnerId);
        let CurrentPet=await Pet.findById(petId);
       
        const approvedRequest = await Request.findById(reqId);
        approvedRequest.status = 'Accepted';
        approvedRequest.message=req.body.message;
        await approvedRequest.save();
        await Request.updateMany(
            { pet: petId, _id: { $ne: reqId } },
            { $set: { status: 'Denied' } }
        );
        CurrentPet.status = 'Adopted';
        await CurrentPet.save();
        if(req.body.contactInfo==='on'){
            approvedRequest.ContactInfo=CurrentOwner.ContactInfo;
            await approvedRequest.save();
            console.log(approvedRequest);
            res.redirect('/MyProfile');
        }
        else{
            res.redirect('/MyProfile');
        }
    }catch(error){
        next(error);
    }
    
});


// Home Route
app.get('/', (req, res) => {
    res.render("home");
});

//Reviews
app.get('/Reviews',async(req,res)=>{
    const Allreviews=await reviews.find({}).populate('author');
    res.render('review',{Allreviews});
})

app.post('/submitReview',isLoggedIn,async(req,res,next)=>{
    try{
        const {review}=req.body;
        const newReview=new reviews({review});
        newReview.author=req.user._id;
        const savedReview=await newReview.save();
        console.log(savedReview);
        res.redirect('/Reviews');
    }catch(error){
        next(error);
    }
}
);
//About Us
app.get('/about',(req,res)=>{
    res.render('About');
})

app.all('*', (req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});


//Error Handling middleware
app.use((err, req, res, next) => {
    res.status(500).render('err', { error: err.message });
});


app.listen(port, () => {
    console.log(`Listening to port ${port}`);
});
