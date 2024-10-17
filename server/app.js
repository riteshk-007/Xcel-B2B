import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// Middlewares
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public/upload"));

// Routes
import userRoutes from "./routers/user.routes.js";
import productRoutes from "./routers/product.routes.js";
import leadsRouter from "./routers/lead.routes.js";
import commentsRouter from "./routers/comment.routes.js";
import categoryRoutes from "./routers/category.routes.js";

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/leads", leadsRouter);
app.use("/api/v1/comments", commentsRouter);
app.use("/api/v1/category", categoryRoutes);

export default app;
