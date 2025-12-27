import process from "node:process";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import routes from "./routes/index.ts";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(bodyParser.json());

app.use(
  cors({
    origin: "*",
  })
);

app.use("/", routes);

app.use(express.json());
app.use(helmet());

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
