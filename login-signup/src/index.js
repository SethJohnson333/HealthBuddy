const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const collection = require("./config");
const { userInfo } = require('os');

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.set('view engine', 'ejs');
app.use(express.static("public"));

app.get("/", (req, res) => {
   res.render("login");
});

app.get("/signup", (req, res) => {
   res.render("signup");
});

app.post("/signup", async (req, res) => {
   const data = {
       name: req.body.username,
       password: req.body.password,
       role: req.body.role
   }

   const existingUser = await collection.findOne({name: data.name});

   if (existingUser) {
       res.send("User already exists. Please choose a different username.");
   }

   else {
       const saltRounds = 10;
       const hashedPassword = await bcrypt.hash(data.password, saltRounds);

       data.password = hashedPassword;

       const userdata = await collection.insertMany(data);
       console.log(userdata);

       return res.redirect("/");
   }
})

app.post("/login", async (req, res) => {
   try{
       const check = await collection.findOne({name: req.body.username});
       if (!check) {
           res.send("user name cannot found");
       }

       const isPasswordMatch = await bcrypt.compare(req.body.password, check.password);
       if (isPasswordMatch) {
           if (check.role === 'patient') {
               res.render("patient");
           }
           else if (check.role === 'doctor') {
               res.render("doctor");
           }
       }else{
           req.send("wrong password");
       }
   }catch {
       res.send("wrong details");
   }
})

const port = 8000;
app.listen(port, () => {
   console.log(`Server running on Port: ${port}`);
});