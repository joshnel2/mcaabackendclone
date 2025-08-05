const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: "*",
  })
);

app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

app.get("/", async (req, res) => {
  res.json({ message: "mcaa server running!!!" });
});

// Routes Imports
const userRoute = require("./routes/userRoutes");
const { default: mongoose } = require("mongoose");

// Routes
app.use("/", userRoute);

//database connection
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => {
//     console.log("DB Connetion Successfull");
//   })
//   .catch((err) => {
//     console.log("err: ", err.message);
//   });

app.listen(PORT, () => {
  console.log("server listening on port ", PORT);
});
