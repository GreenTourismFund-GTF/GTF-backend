import mongoose, { Document, Schema, Model } from 'mongoose';

interface ITeamMember {
  name: string;
  role: string;
  email?: string;
  joinedAt: Date;
}

interface IMilestone {
  title: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  dueDate?: Date;
  completedAt?: Date;
  description?: string;
}

interface IProjectWallets {
  bitcoin: string;
  near: string;
  lethal: string;
}

interface IProjectUpdate {
  message: string;
  date: Date;
  author: string;
  type: 'milestone' | 'funding' | 'general';
}

// Main Project interface extending Document
export interface IProject extends Document {
  projectId: string;
  title: string;
  description: string;
  longDescription: string;
  category: 'Environment' | 'Technology' | 'Education' | 'Healthcare';
  goal: number;
  raised: number;
  location: string;
  duration: string;
  impact: 'high' | 'medium' | 'low';
  date?: Date;
  status: 'completed' | 'in-progress' | 'planned';
  client?: string;
  tags: string[];
  team: ITeamMember[];
  milestones: IMilestone[];
  wallets: IProjectWallets;
  supporters: number;
  images: string[];
  updates: IProjectUpdate[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  endDate?: Date;

  addTeamMember(member: Partial<ITeamMember>): Promise<void>;
  removeTeamMember(memberName: string): Promise<void>;
  updateProgress(amount: number): Promise<void>;
  addUpdate(update: Partial<IProjectUpdate>): Promise<void>;
  calculateTimeRemaining(): number;
  isOverdue(): boolean;
  remove(): Promise<{ success: boolean; message: string }>;
}

interface IProjectModel extends Model<IProject> {
  findByProjectId(projectId: string): Promise<IProject | null>;
  findActiveProjects(): Promise<IProject[]>;
  findProjectsByTag(tag: string): Promise<IProject[]>;
  findSimilarProjects(projectId: string): Promise<IProject[]>;
}

const TeamMemberSchema = new Schema<ITeamMember>({
  name: { 
    type: String, 
    required: [true, 'Team member name is required'],
    trim: true
  },
  role: { 
    type: String, 
    required: [true, 'Team member role is required'],
    trim: true
  },
  email: { 
    type: String,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    lowercase: true
  },
  joinedAt: { 
    type: Date, 
    default: Date.now 
  }
});

const MilestoneSchema = new Schema<IMilestone>({
  title: { 
    type: String, 
    required: [true, 'Milestone title is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['completed', 'in-progress', 'upcoming'],
    required: true,
    default: 'upcoming'
  },
  dueDate: Date,
  completedAt: Date,
  description: String
});

const WalletsSchema = new Schema<IProjectWallets>({
  bitcoin: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v: string) {
        return /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/.test(v);
      },
      message: 'Invalid Bitcoin address'
    }
  },
  near: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v: string) {
        return /^[a-z0-9_-]{2,64}\.near$/.test(v);
      },
      message: 'Invalid NEAR address'
    }
  },
  lethal: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v: string) {
        return /^0x[a-fA-F0-9]{40}$/.test(v);
      },
      message: 'Invalid Lethal address'
    }
  }
});

const ProjectUpdateSchema = new Schema<IProjectUpdate>({
  message: { 
    type: String, 
    required: true 
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
  author: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['milestone', 'funding', 'general'],
    required: true
  }
});

const ProjectSchema = new Schema<IProject>(
  {
    title: { 
      type: String, 
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
      index: true
    },
    description: { 
      type: String, 
      required: [true, 'Project description is required'],
      maxlength: [500, 'Description cannot be more than 500 characters']
    },
    longDescription: { 
      type: String, 
      required: [true, 'Detailed project description is required']
    },
    category: {
      type: String,
      enum: ['Environment', 'Technology', 'Education', 'Healthcare'],
      required: true,
      index: true
    },
    goal: { 
      type: Number, 
      required: true,
      min: [0, 'Goal amount must be positive']
    },
    raised: { 
      type: Number, 
      required: true,
      default: 0,
      min: [0, 'Raised amount cannot be negative']
    },
    location: { 
      type: String, 
      required: true 
    },
    duration: { 
      type: String, 
      required: true 
    },
    impact: {
      type: String,
      enum: ['high', 'medium', 'low'],
      required: true
    },
    date: { type: Date },
    status: {
      type: String,
      enum: ['completed', 'in-progress', 'planned'],
      default: 'planned',
      required: true
    },
    client: { type: String },
    tags: [{
      type: String,
      lowercase: true,
      trim: true
    }],
    team: [TeamMemberSchema],
    milestones: [MilestoneSchema],
    wallets: { 
      type: WalletsSchema, 
      required: true 
    },
    supporters: { 
      type: Number, 
      default: 0,
      min: 0
    },
    images: [{
      type: String,
      validate: {
        validator: function(v: string) {
          return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
        },
        message: 'Invalid image URL'
      }
    }],
    updates: [ProjectUpdateSchema],
    isActive: {
      type: Boolean,
      default: true
    },
    endDate: Date
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

ProjectSchema.index({ category: 1, status: 1 });
ProjectSchema.index({ tags: 1 });
ProjectSchema.index({ 'team.name': 1 });
ProjectSchema.index({ createdAt: -1 });
ProjectSchema.index({ projectId: 1 }, { unique: true });
ProjectSchema.index({ location: 1 });
ProjectSchema.index({ isActive: 1 });

ProjectSchema.virtual('progress').get(function(this: IProject) {
  return (this.raised / this.goal) * 100;
});

ProjectSchema.virtual('daysRemaining').get(function(this: IProject) {
  if (!this.endDate) return null;
  const now = new Date();
  const end = new Date(this.endDate);
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

ProjectSchema.methods.addTeamMember = async function(member: Partial<ITeamMember>) {
  this.team.push({
    ...member,
    joinedAt: new Date()
  });
  await this.save();
};

ProjectSchema.methods.removeTeamMember = async function(memberName: string) {
  this.team = this.team.filter((member: ITeamMember) => member.name !== memberName);
  await this.save();
};

ProjectSchema.methods.updateProgress = async function(amount: number) {
  this.raised += amount;
  if (this.raised >= this.goal) {
    this.status = 'completed';
  }
  await this.save();
};

ProjectSchema.methods.addUpdate = async function(update: Partial<IProjectUpdate>) {
  this.updates.push({
    ...update,
    date: new Date()
  });
  await this.save();
};

ProjectSchema.methods.remove = async function(): Promise<{ success: boolean; message: string }> {
    try {
      
      // Remove the project document
      await mongoose.model('Project').deleteOne({ _id: this._id });
      
      return {
        success: true,
        message: 'Project successfully deleted'
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete project: ${error.message}`);
      } else {
        throw new Error('Failed to delete project due to an unknown error');
      }
    }
  };
  

ProjectSchema.methods.calculateTimeRemaining = function() {
  if (!this.endDate) return 0;
  const now = new Date();
  const end = new Date(this.endDate);
  return Math.max(0, end.getTime() - now.getTime());
};

ProjectSchema.methods.isOverdue = function() {
  if (!this.endDate) return false;
  return new Date() > new Date(this.endDate) && this.status !== 'completed';
};

ProjectSchema.statics.findByProjectId = function(projectId: string) {
  return this.findOne({ projectId });
};

ProjectSchema.statics.findActiveProjects = function() {
  return this.find({ isActive: true, status: { $ne: 'completed' } });
};

ProjectSchema.statics.findProjectsByTag = function(tag: string) {
  return this.find({ tags: tag.toLowerCase() });
};

ProjectSchema.statics.findSimilarProjects = function(projectId: string) {
  return this.findOne({ projectId })
    .then((project: IProject | null) => {
      if (!project) return [];
      return this.find({
        category: project.category,
        _id: { $ne: project._id },
        tags: { $in: project.tags }
      }).limit(5);
    });
};

// Middleware
ProjectSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Set default endDate based on duration if not set
    if (!this.endDate && this.duration) {
      const durationInMonths = parseInt(this.duration);
      if (!isNaN(durationInMonths)) {
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + durationInMonths);
        this.endDate = endDate;
      }
    }
  }
  
  // Update status based on progress
  if (this.raised >= this.goal) {
    this.status = 'completed';
  } else if (this.raised > 0) {
    this.status = 'in-progress';
  }

  next();
});

// Create and export the model
const Project = mongoose.model<IProject, IProjectModel>('Project', ProjectSchema);
export default Project;