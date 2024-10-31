import express from "express";
import projectRouter from "../routes/ProjectRoutes"


export const mountedRoutes = function (app: any)
{
  app.use(express.json());

  app.use("/api/v1/projects", projectRouter);

};
