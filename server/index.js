const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
require("./models/db.connection");
const PORT = process.env.PORT;
const authrouter = require("./routes/auth.route");
const jobrouter = require("./routes/job.route");
const postrouter = require("./routes/post.route");
const bodyParser = require("body-parser")
const cors = require("cors");

const app = express();

app.use(bodyParser.json());
app.use(cors());


app.use("/auth",authrouter);
app.use("/job",jobrouter);
app.use("/posts",postrouter);

app.get("/health",(req,res)=>{
    res.status(200).json("Api is healthy");
})

app.listen(PORT,()=>{
    console.log("Server is listning to ",{PORT})
})