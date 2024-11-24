import express from "express";
import projectRouter from "../routes/ProjectRoutes";
import userRouter from "../routes/userRoutes";


export const mountedRoutes = function (app: any)
{
  app.use(express.json());

  app.use("/api/v1/projects", projectRouter);
  app.use("/api/v1/users", userRouter);

};
