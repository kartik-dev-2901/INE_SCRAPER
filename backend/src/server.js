const express = require("express");
const cors = require("cors");
const trackedProductsRouter =
    require("./routes/trackedProducts");
const productsRouter = require("./routes/products");
const internalRouter = require("./routes/internal");

const app = express();

app.use(cors());
app.use(express.json());

app.use(
    "/api/tracked-products",
    trackedProductsRouter
);
app.use("/api/products", productsRouter);
app.use("/api/internal", internalRouter);
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});