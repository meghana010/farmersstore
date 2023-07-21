const express = require("express");
const app = express();
const mongoose=require('mongoose');
const path = require('path');
const multer = require('multer');
const fs=require('fs');
const {regTable} = require("./models/user");
const formData = require('./data');
const session = require('express-session');


app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true
}));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads"); // Specify the directory where uploaded files will be stored
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname)); // Set the filename to be unique
  },
});

// Create the multer instance
const upload = multer({ storage: storage });


app.use(express.static(__dirname)); 
app.use(express.json());
app.use(express.urlencoded({extended: true}))
// View Engine Setup

app.set('views', path.join(__dirname, 'views'))

app.set('view engine', 'ejs')


app.get("/farmersStore", (req, res) => {
    res.sendFile(__dirname + "/welcome.html");
  });
  
  const userSchema = new mongoose.Schema({
    product:String,
    price:String,
    quantity:Number,
    file: {
      data: Buffer,
      contentType: String
    },
    
  });
  const feedback=new mongoose.Schema({
name:String,
email:String,
message:String,
  });
app.post('/contactuser.ejs',(req,res)=>{
  const feedb = mongoose.model('feedbackform', feedback,'feedbackform');
  const name=req.body.name;
  const email=req.body.email;
  const message=req.body.message;
  const f=new feedb({name,email,message});
  f.save().then(() => {
    res.send('<h1>Submitted</h1>');
  })
  .catch(error => {
    console.error('Error', error);
   
  });
});

  const productSchema = new mongoose.Schema({
    product: {
      type: String,
      
    },
    price: {
      type: String,
     
    },
    quantity:{
      type: Number,
     
    },
    image: {
      data: Buffer, 
      contentType: String
    }
  });
 
  //const UserProducts = mongoose.model('Product', productSchema,'Product');
  
  function generateUniqueId(firstname,lastname) {
  
    
    const uniqueId = `${firstname}_${lastname}`;
    return uniqueId;
  }







  app.post("/register.html", (req, res)=>{
    const reg = new regTable(req.body);
  reg.save((error, result)=>{
      if(error) throw error
     
      res.sendFile(path.join(__dirname,'/registeredsucc.html'));

    });
  });

  app.post('/login.html', (req, res) => {
    var firstname = req.body.firstname;
    var pass = req.body.pass;
    var lastname=req.body.lastname;
    var loginas=req.body.loginas;
    req.session.formData ={
   firstname:req.body.firstname,
    lastname:req.body.lastname,
    loginas:req.body.loginas}
    const userId= generateUniqueId(firstname,lastname);
    req.session.userId = userId;
   
    const allProducts= mongoose.model('User', userSchema,'User');
    regTable.findOne({firstname:firstname,lastname:lastname,pass:pass,registeras:loginas},
      function(err,result){
        if(err)
        throw err;

        app.use(function(req, res, next) {
          res.locals.formData = formData;
          next();
        });

      

        if(!result)
        {
          res.sendFile(path.join(__dirname,'/loginfailed.html'));
        }
        if(result)
        {
          res.render("homeuser.ejs", { session: req.session });

          app.post('/loginuser.ejs',upload.single('file'),(req, res) => {
            var product= req.body.product;
            var price = req.body.price;
            var quantity = parseInt(req.body.quantity,10);
            var  file={
              data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
              contentType: req.file.mimetype
          
      };
            if (!req.file) {
              res.status(400).send('No file uploaded');
              return;
            }
           
            try {
              const userId = req.session.userId;
                const UserCollection = mongoose.model(`User_${userId}`, userSchema,`User_${userId}`);
                const allProducts= mongoose.model('User', userSchema,'User');
            const x=new  UserCollection( {product,price,quantity,file});
            const allp=new  allProducts( {product,price,quantity,file});

  
             x.save().then(() => {
              res.redirect('/loginuser.ejs');
            })
            .catch(error => {
              console.error('Error saving image:', error);
             
            });

            allp.save().then(() => {
              console.log('Saved in shopuser.ejs');
            })
            .catch(error => {
              console.error('Error saving image:', error);
             
            });
          
          
            
          } catch (error) {
            res.status(500).json({ error: 'An error occurred during doc creatn' });
          
        
          }
        });
       
        app.post('/shopuser.ejs', (req, res) => {
          var productId = req.body.productId;
          var product= req.body.product;
            var price = req.body.price;
            var quantity=req.body.quantity;
            if(typeof quantity !== 'undefined' && quantity.length>0)
            quantity=parseInt(quantity,10);
            else
            quantity=0;
            var q=quantity;
            var im = req.body.file;


           
            
           //const { product, price, im} = req.body;
            if (!im) {
              res.status(400).send('No image data provided');
              return;
            }
            const image = Buffer.from(im, 'base64');
            contentType = 'image/png';
            const update = { $inc: { quantity: -quantity } };
            const quantityToUpdate = -quantity;
            //{product:product,price:price}

             allProducts.findOneAndUpdate({_id:productId,$expr: { $gte: [{ $add: ["$quantity", quantityToUpdate] }, 0] }
  },update, 
              {
                  returnNewDocument: true
              } ,function( error, result){
              if(error)
              throw error;
            });
            try {
             // if(productDoc)
              const userId = req.session.userId;
              const collectionName = `Product_${userId}`;

  let UserProducts;
  if (mongoose.models[collectionName]) {
    // If the model already exists, use it
    UserProducts = mongoose.model(collectionName);
  } else {
    // If the model doesn't exist, create a new one
    UserProducts = mongoose.model(collectionName, productSchema, collectionName);
  }
            quantity=q;
            allProducts.findOne({ _id: productId }, (err, productDoc) => {
              if (err) {
                console.error('Error finding the product:', err);
                // Handle the error accordingly
                return;
              }
              if (productDoc && productDoc.quantity >=q && q>0) {
            const x=new  UserProducts( {product,price,quantity,image:{ data: image, contentType }});
          
            
             x.save().then(() => {
              res.redirect('/shopuser.ejs');
            })
            .catch(error => {
              console.error('Error saving image:', error);
          
                      });
                    }
          
        });
      }
    
          catch (error) {
            res.status(500).json({ error: 'An error occurred during doc creatn' });
          
        
          }            
        });
    
    
      

        app.get('/aboutuser.ejs', function (req, res) {
          res.render('aboutuser.ejs', { session: req.session });
          //res.render('aboutuser.ejs',{name:firstname,lastname:lastname,pass:pass,loginas:loginas});
        });
        app.get('/contactuser.ejs', function (req, res) {
          res.render('contactuser.ejs', { session: req.session });
          //res.render('contactuser.ejs',{name:firstname,lastname:lastname,pass:pass,loginas:loginas});
        });

        app.get('/payment.ejs', function (req, res) {
          res.render('payment.ejs', { session: req.session });
          //res.render('contactuser.ejs',{name:firstname,lastname:lastname,pass:pass,loginas:loginas});
        });
        app.get('/shopuser.ejs', function (req, res) {
          allProducts.find({}, (err, data) => {
            if (err) {
              console.error('Error fetching data:', err);
              data = []; 
            }
            res.render('shopuser.ejs', { session: req.session ,cData:data});
          //res.render('shopuser.ejs',{name:firstname,lastname:lastname,pass:pass,loginas:loginas,cData:data});
        });
      });
        app.get('/loginuser.ejs', function (req, res) {

          const userId = req.session.userId;
          const UserCollection = mongoose.model(`User_${userId}`, userSchema, `User_${userId}`);
          const collectionName = `Product_${userId}`;

  let UserProducts;
  if (mongoose.models[collectionName]) {
    // If the model already exists, use it
    UserProducts = mongoose.model(collectionName);
  } else {
    // If the model doesn't exist, create a new one
    UserProducts = mongoose.model(collectionName, productSchema, collectionName);
  }
            
          const fetchUserData = new Promise((resolve, reject) => {
            UserCollection.find({}, (err, data) => {
              if (err) {
                console.error('Error fetching user data:', err);
                reject(err);
              } else {
                resolve(data);
              }
            });
          });
          
          const fetchProductData = new Promise((resolve, reject) => {
            UserProducts.find({}, (err, data) => {
              if (err) {
                console.error('Error fetching product data:', err);
                reject(err);
              } else {
                resolve(data);
              }
            });
          });
          
          Promise.all([fetchUserData, fetchProductData])
            .then(([userData, productData]) => {
              res.render('loginuser.ejs', { session: req.session, cData: userData, productData :productData});
            })
            .catch((error) => {
              console.error('An error occurred:', error);
              res.render('loginuser.ejs', { session: req.session, cData: [], productData: [] });
            });
          


        });
        app.get('/homeuser.ejs', function (req, res) {
          res.render('homeuser.ejs', { session: req.session });
         // res.render('homeuser.ejs',{name:firstname,lastname:lastname,pass:pass,loginas:loginas});
        });




   /*    app.get('/homeuser.ejs', function (req, res) {
 
          res.render('homeuser.ejs',{name:firstname,lastname:lastname,pass:pass,loginas:loginas});
        });
        app.get('/loginuser.ejs', function (req, res) {
          UserCollection.find({}, (err, data) => {
            if (err) {
              console.error('Error fetching data:', err);
              data = []; 
            }
          res.render('loginuser.ejs',{name:firstname,lastname:lastname,pass:pass,loginas:loginas,cData:data});
          });
        });
        app.get('/aboutuser.ejs', function (req, res) {
 
          res.render('aboutuser.ejs',{name:firstname,lastname:lastname,pass:pass,loginas:loginas});
        });
        app.get('/contactuser.ejs', function (req, res) {

          res.render('contactuser.ejs',{name:firstname,lastname:lastname,pass:pass,loginas:loginas});
        });
        app.get('/shopuser.ejs', function (req, res) {
          allProducts.find({}, (err, data) => {
            if (err) {
              console.error('Error fetching data:', err);
              data = []; 
            }
          res.render('shopuser.ejs',{name:firstname,lastname:lastname,pass:pass,loginas:loginas,cData:data});
        });
        });      */   

      }
    });
      });

      var fetchRouter = require('./routes/fetch-route');
      app.use('/', fetchRouter);

  app.listen(3000, () => {
    console.log("Application started and Listening on port 3000");
  });
