const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require("mongoose")
const bodyparser = require("body-parser")
require('dotenv').config()

mongoose.connect(process.env.thisData, { useNewUrlParser: true, useUnifiedTopology: true })
.then(console.log("mongoDB connected"))
.catch((err) => {console.log("mongoDB could not be connected")})

const userSchema = new mongoose.Schema({
  username: String,
  count: Number,
  log: [{
    description: String,
    duration: Number,
    date: String,
  }]
})
let User = mongoose.model("User", userSchema)



app.use(cors())
app.use(express.static('public'))
app.use(bodyparser.urlencoded({extended: false}))


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get("/api/users", (req, res) => {
  User.find().then((data) => {
    res.json(data)
  })
});


app.post("/api/users", (req, res) => {
  User.find({username: req.body.username})
  .then(data => {
    if (data.length === 0) {
      let newUser = new User({username: req.body.username})
      newUser.save().then(newdata => {
        res.json({username: newdata.username, _id: newdata._id})
       })
    } else {
      res.json({username: data[0].username, _id: data[0]._id})
    }
  })
});

app.post("/api/users/:_id/exercises", (req, res) => {
  let correctDate = req.body.date ? new Date(req.body.date).toDateString() : new Date().toDateString()
  const exDetails = {
    description: req.body.description,
    duration: Number(req.body.duration),
    date: correctDate
    }
  User.findOneAndUpdate({_id: req.params._id}, {$push: {log: [exDetails]}, $inc: {count: 1}}, {new: true})
    .then(data => {
    res.json({_id: req.params._id, username: data.username, ...exDetails})
  })
  .catch(() => {
    res.json({error: "no such id"})
  })
});

app.get("/api/users/:_id/logs", (req, res) => {
  let fromDate = req.query.from ? new Date(req.query.from).getTime() : ""
  let toDate = req.query.to? new Date(req.query.to).getTime() : ""
  User.findById({_id: req.params._id}).then(data => {
    const limit = req.query.limit || 50
    if (fromDate) {
      const newData = data.log.filter(e => new Date(e.date).getTime() >= fromDate && new Date(e.date).getTime() <= toDate)
      res.json({id: data._id, username: data.username, count: newData.length, log: newData.slice(0, limit)})
    } else if (req.query.limit) {
      res.json({id: data._id, username: data.username, count: data.log.length, log: data.log.slice(0, limit)})
    } else {res.json(data)}
  })
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
