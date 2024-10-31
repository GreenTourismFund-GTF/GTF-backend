import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import Project from '../models/ProjetModel';

declare global
{
  namespace Express
  {
    interface Request
    {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

const AuthSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const validateAuthInput = (req: Request, res: Response, next: NextFunction) =>
{
  try
  {
    AuthSchema.parse(req.body);
    next();
  } catch (error)
  {
    if (error instanceof z.ZodError)
    {
      res.status(400).json({
        success: false,
        error: error.errors
      });
    } else
    {
      next(error);
    }
  }
};

export const authenticateUser = (req: Request, res: Response, next: NextFunction) =>
{
  try
  {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token)
    {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded as any;
    next();
  } catch (error)
  {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

export const authorizeAdmin = (req: Request, res: Response, next: NextFunction) =>
{
  if (req.user?.role !== 'admin')
  {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  next();
};

export const authorizeProjectMember = async (req: Request, res: Response, next: NextFunction) =>
{
  try
  {
    const project = await Project.findByProjectId(req.params.projectId);
    if (!project)
    {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const isMember = project.team.some(member => member.email === req.user?.email);
    if (!isMember && req.user?.role !== 'admin')
    {
      return res.status(403).json({
        success: false,
        error: 'Project member access required'
      });
    }
    next();
  } catch (error)
  {
    next(error);
  }
};