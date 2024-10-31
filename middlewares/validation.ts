import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const ProjectSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  longDescription: z.string().min(1),
  category: z.enum(['Environment', 'Technology', 'Education', 'Healthcare']),
  goal: z.number().min(0),
  location: z.string().min(1),
  duration: z.string().min(1),
  impact: z.enum(['high', 'medium', 'low']),
  client: z.string().optional(),
  tags: z.array(z.string()),
  wallets: z.object({
    bitcoin: z.string().regex(/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/),
    near: z.string().regex(/^[a-z0-9_-]{2,64}\.near$/),
    lethal: z.string().regex(/^0x[a-fA-F0-9]{40}$/)
  }),
  images: z.array(z.string().url()).optional()
});

// Team member input validation schema
const TeamMemberSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  email: z.string().email().optional()
});

// Project update input validation schema
const UpdateSchema = z.object({
  message: z.string().min(1),
  author: z.string().min(1),
  type: z.enum(['milestone', 'funding', 'general'])
});

export const validateProjectInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    ProjectSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: error.errors
      });
    } else {
      next(error);
    }
  }
};

export const validateTeamMemberInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    TeamMemberSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: error.errors
      });
    } else {
      next(error);
    }
  }
};

export const validateUpdateInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    UpdateSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: error.errors
      });
    } else {
      next(error);
    }
  }
};