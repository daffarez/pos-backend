import express from "express";
import v1Router from "./routes/v1";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import * as OpenApiValidator from "express-openapi-validator";

const app = express();
app.use(express.json());

const apiSpec = path.join(
  __dirname,
  "../../../packages/contracts/openapi.yaml",
);

const swaggerDocument = YAML.load(apiSpec);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(
  OpenApiValidator.middleware({
    apiSpec,
    validateRequests: true,
  }),
);

app.use("/v1", v1Router);

export default app;
