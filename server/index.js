const express = require("express");
const app = express();
const path = require("path");
const cors = require('cors')

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
// Image upload Multer
const multer = require('multer');
const fs = require('fs');
// 
const server = require('http').createServer(app);
const io = require('socket.io')(server);
// io.origins('*:*') // for latest version
io.set('origins', 'http://localhost:3000');
const config = require("./config/key");


/* Import Schema  */
const {Chat} = require('./models/Chat');
const {auth} = require('./middleware/auth');

const mongoose = require("mongoose");
const connect = mongoose.connect(config.mongoURI,
  {
    useNewUrlParser: true, useUnifiedTopology: true,
    useCreateIndex: true, useFindAndModify: false
  })
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log(err));

app.use(cors())


//to not get any deprecation warning or error
//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));
//to get json data
// support parsing of application/json type post data
app.use(bodyParser.json());
app.use(cookieParser());

app.use('/api/users', require('./routes/users'));
app.use('/api/chat', require('./routes/chat'));




var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, `${ Date.now()}_${file.originalname}`)
  }
})
 
var upload = multer({ storage: storage }).single("file");

app.post("/api/chat/uploadfiles", auth ,(req, res) => {
  upload(req, res, err => {
    if(err) {
      return res.json({ success: false, err })
    }
    return res.json({ success: true, url: res.req.file.path });
  })
});












/* Socket configuration ### START ### */

io.on('connection', (socket) => {
  socket.on('Input Chat Message', msg => {
    console.log(msg)
    connect.then(db => {
      try {
        let chat = new Chat({
          message:msg.chatMessage ,
          sender:msg.userId,
          type:msg.type
        });
        chat.save((err, doc) => {
          if(err) {
            return res.json({success:false, err});
          };
  
          Chat.find({"_id":doc._id})
            .populate("sender")
            .exec((err, doc) => {
              console.log(doc)
              return io.emit("Output Chat Message", doc);
            })
        }) 
      } catch (error) {
        console.error(error)
      }
    })
  })
})



//use this to show the image you have in node js server to client (react js)
//https://stackoverflow.com/questions/48914987/send-image-path-from-node-js-express-server-to-react-client
app.use('/uploads', express.static('uploads'));

// Serve static assets if in production
if (process.env.NODE_ENV === "production") {

  // Set static folder
  app.use(express.static("client/build"));

  // index.html for all page routes
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../client", "build", "index.html"));
  });
}

const port = process.env.PORT || 5000

server.listen(port, () => {
  console.log(`Server Running at ${port}`)
});