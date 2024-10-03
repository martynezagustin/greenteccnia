const express = require("express")
const app = express()
require("dotenv").config()
const bodyParser = require("body-parser")
const cors = require("cors")
const morgan = require("morgan")
const connectDB = require("./config/db")
const PORT = process.env.PORT || 3000

const userRoutes = require("./routes/userRoutes")
const financeRoutes = require("./routes/financeRoutes")

//usos esenciales
connectDB()
app.use(cors())
app.use(morgan("dev"))
app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json())
app.use("/", userRoutes)
app.use("/", financeRoutes)

app.listen(PORT, ()=> {
    console.log(`GreenTeccnia+. Servidor escuchando en ${PORT}`);
})