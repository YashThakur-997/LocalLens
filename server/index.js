const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
require("./models/db.connection");
const PORT = process.env.PORT;
const authrouter = require("./routes/auth.route");
const jobrouter = require("./routes/job.route");
const bodyParser = require("body-parser")

const app = express();

app.use(bodyParser.json());


app.use("/auth",authrouter);
app.use("/job",jobrouter);

app.get("/health",(req,res)=>{
    res.status(200).json("Api is healthy");
})

app.listen(PORT,()=>{
    console.log("Server is listning to ",{PORT})
})