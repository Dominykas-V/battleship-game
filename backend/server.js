import express from "express";
import cors from "cors";

const app = express();

//cors fixes some errors (it was recommended)
app.use(cors());
app.use(express.json());

app.use("*", (req, res) => res.status(404).json({ error: "Wrong api call." }));

app.listen(5000, () => {
  console.log("Backend running on port: 5000");
});
