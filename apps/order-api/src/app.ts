import express from "express";
import path from "path";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import * as OpenApiValidator from "express-openapi-validator";
import ordersRouter from "./routes/orders";

const app = express();

app.use(express.json());

const apiSpec = path.join(
  __dirname,
  "../../../packages/contracts/openapi.yaml",
);

const swaggerDocument = YAML.load(apiSpec);

app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    swaggerOptions: {
      url: "/v1",
    },
  }),
);

app.use(
  OpenApiValidator.middleware({
    apiSpec,
    validateRequests: true,
    validateResponses: true,
  }),
);

app.use("/v1", ordersRouter);

export default app;
