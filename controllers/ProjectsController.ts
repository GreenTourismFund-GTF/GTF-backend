import express from 'express';
import { Router, Request, Response, NextFunction } from 'express';
import nodemailer from 'nodemailer';
import { validateProjectInput, validateTeamMemberInput, validateUpdateInput } from '../middlewares/validation';
import { authenticateUser, authorizeAdmin } from '../middlewares/Authentication';
import { uploadImages } from '../middlewares/FileUpload';
import catchAsync from "../utils/catchAsync";
import Project from '../models/ProjetModel';

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const router: Router = express.Router();

// Helper function to send notification emails
async function sendNotificationEmail(to: string, subject: string, html: string)
{
  try
  {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
  } catch (error)
  {
    console.error('Email sending failed:', error);
  }
}

// Error handler middleware
const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) =>
{
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
};


export const getProjects = catchAsync(async (req: Request, res: Response, next: NextFunction) =>
{
  try
  {
    const {
      category,
      status,
      tag,
      location,
      impact,
      isActive,
      page = 1,
      limit = 10
    } = req.query;

    const query: any = {};

    if (category) query.category = category;
    if (status) query.status = status;
    if (tag) query.tags = tag;
    if (location) query.location = location;
    if (impact) query.impact = impact;
    if (isActive !== undefined) query.isActive = isActive;

    const skip = (Number(page) - 1) * Number(limit);

    const projects = await Project.find(query)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Project.countDocuments(query);

    res.json({
      success: true,
      data: projects,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error)
  {
    next(error);
  }
});



// Get a single project by ID
const getProjectById = catchAsync(async (req: Request, res: Response, next: NextFunction) =>
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
    res.json({
      success: true,
      data: project
    });
  } catch (error)
  {
    next(error);
  }
});


export const addProject = catchAsync(async (req: Request, res: Response, next: NextFunction) =>
{
  try
  {
    const project = new Project(req.body);
    await project.save();

    // Send notification email to admin
    await sendNotificationEmail(
      process.env.ADMIN_EMAIL!,
      'New Project Created',
      `A new project "${project.title}" has been created and needs review.`
    );

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error)
  {
    next(error);
  }
});


export const updateProject = catchAsync(async (req: Request, res: Response, next: NextFunction) =>
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

    Object.assign(project, req.body);
    await project.save();

    // Notify team members about project updates
    for (const member of project.team)
    {
      if (member.email)
      {
        await sendNotificationEmail(
          member.email,
          'Project Updated',
          `The project "${project.title}" has been updated.`
        );
      }
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error)
  {
    next(error);
  }
});

// DELETE /api/projects/:projectId
// Delete a project

const deleteProject = catchAsync(async (req: Request, res: Response, next: NextFunction) =>
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

    await project.remove()

    // Notify team members about project deletion
    for (const member of project.team)
    {
      if (member.email)
      {
        await sendNotificationEmail(
          member.email,
          'Project Deleted',
          `The project "${project.title}" has been deleted.`
        );
      }
    }

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error)
  {
    next(error);
  }
});

// POST /api/projects/:projectId/team
// Add a team member to a project

const addATeamMember = catchAsync(async (req: Request, res: Response, next: NextFunction) =>
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

    await project.addTeamMember(req.body);

    // Send welcome email to new team member
    if (req.body.email)
    {
      await sendNotificationEmail(
        req.body.email,
        'Welcome to the Project Team',
        `You have been added to the project "${project.title}" as ${req.body.role}.`
      );
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error)
  {
    next(error);
  }
});

// DELETE /api/projects/:projectId/team/:memberName
// Remove a team member from a project

export const deleteATeamMember = catchAsync(async (req: Request, res: Response, next: NextFunction) =>
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

    const member = project.team.find(m => m.name === req.params.memberName);
    if (member?.email)
    {
      await sendNotificationEmail(
        member.email,
        'Project Team Update',
        `You have been removed from the project "${project.title}".`
      );
    }

    await project.removeTeamMember(req.params.memberName);

    res.json({
      success: true,
      data: project
    });
  } catch (error)
  {
    next(error);
  }
});

// POST /api/projects/:projectId/updates
// Add an update to a project

export const updateAProject = catchAsync(async (req: Request, res: Response, next: NextFunction) =>
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

    await project.addUpdate(req.body);

    // Notify team members about the update
    for (const member of project.team)
    {
      if (member.email)
      {
        await sendNotificationEmail(
          member.email,
          'New Project Update',
          `A new update has been posted to "${project.title}": ${req.body.message}`
        );
      }
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error)
  {
    next(error);
  }
});

// POST /api/projects/:projectId/progress
// Update project progress

export const updateProjectProgress = catchAsync(async (req: Request, res: Response, next: NextFunction) =>
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

    const { amount } = req.body;
    await project.updateProgress(amount);

    // Send notifications based on progress milestones
    if (project.status === 'completed')
    {
      // Notify all team members about project completion
      for (const member of project.team)
      {
        if (member.email)
        {
          await sendNotificationEmail(
            member.email,
            'Project Completed!',
            `The project "${project.title}" has reached its goal and is now complete!`
          );
        }
      }
    } else if ((project.raised / project.goal) >= 0.75)
    {
      // Notify when project reaches 75% of goal
      for (const member of project.team)
      {
        if (member.email)
        {
          await sendNotificationEmail(
            member.email,
            'Project Milestone Reached',
            `The project "${project.title}" has reached 75% of its funding goal!`
          );
        }
      }
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error)
  {
    next(error);
  }
});

// GET /api/projects/:projectId/similar
// Get similar projects
const getSimilarProject = catchAsync(async (req: Request, res: Response, next: NextFunction) =>
{
  try
  {
    const similarProjects = await Project.findSimilarProjects(req.params.projectId);
    res.json({
      success: true,
      data: similarProjects
    });
  } catch (error)
  {
    next(error);
  }
});

// GET /api/projects/tag/:tag
// Get projects by tag
export const getProjectTag = catchAsync(async (req: Request, res: Response, next: NextFunction) =>
{
  try
  {
    const projects = await Project.findProjectsByTag(req.params.tag);
    res.json({
      success: true,
      data: projects
    });
  } catch (error)
  {
    next(error);
  }
});

// GET /api/projects/active
// Get all active projects
export const activeProjects = catchAsync(async (req: Request, res: Response, next: NextFunction) =>
{
  try
  {
    const projects = await Project.findActiveProjects();
    res.json({
      success: true,
      data: projects
    });
  } catch (error)
  {
    next(error);
  }
});
