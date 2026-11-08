const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swaggerSpec");

const router = express.Router();

const customSwaggerOptions = {
  customSiteTitle: "Mama La Hotel & Co. — API Documentation",
  customCss: `
    .swagger-ui .topbar { background-color: #1a202c; border-bottom: 3px solid #e2b774; }
    .swagger-ui .topbar .topbar-wrapper img { content: url('https://placehold.co/180x40/1a202c/e2b774?text=MAMA+LA+HOTEL'); }
    .swagger-ui .info .title { color: #1a202c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .swagger-ui .btn.authorize { background-color: #e2b774; color: #1a202c; border-color: #e2b774; font-weight: 700; }
    .swagger-ui .btn.authorize svg { fill: #1a202c; }
    .swagger-ui .opblock.opblock-post { border-color: #49cc90; }
    .swagger-ui .opblock.opblock-get { border-color: #61affe; }
    .swagger-ui .opblock.opblock-put { border-color: #fca130; }
    .swagger-ui .opblock.opblock-delete { border-color: #f93e3e; }
    .swagger-ui .opblock.opblock-patch { border-color: #50e3c2; }
    .swagger-ui blockquote {
      border-left: 4px solid #e2b774;
      background: #fdfbf7;
      padding: 10px 16px;
      margin: 12px 0;
      border-radius: 4px;
      color: #744210;
    }
  `,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: "list",
    filter: true
  }
};

// Route to serve the raw OpenAPI JSON specification (useful for Postman / Insomnia import)
router.get("/json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Serve interactive Swagger UI
router.use("/", swaggerUi.serve, swaggerUi.setup(swaggerSpec, customSwaggerOptions));

module.exports = router;

