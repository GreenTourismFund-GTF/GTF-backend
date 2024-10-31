import express from 'express';
import { addProject } from '../controllers/ProjectsController';

const router = express.Router();


router.route("/projects").post(addProject);

export default router;