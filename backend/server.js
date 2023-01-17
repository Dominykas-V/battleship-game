import express from "express";
import cors from "cors";
import battleships from "./api/battleships.route.js";

const app = express();

//cors fixes some errors (it was recommended)
app.use(cors());
app.use(express.json());

app.use("/api/v1/battleships", battleships);
app.use("*", (req, res) => res.status(404).json({ error: "Wrong api call.", res:res }));

app.listen(5000, () => {
  console.log("Backend running on port: 5000");
});
