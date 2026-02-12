import app from "./app";
import config from "@pos/config";

const apiPort = config.get("port");

app.listen(apiPort, () => {
  console.log("Order API running on http://localhost:3000");
});
