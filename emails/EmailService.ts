import nodemailer from 'nodemailer';
import { renderFile } from 'ejs';
import { join } from 'path';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  private async renderTemplate(template: string, data: any): Promise<string> {
    return new Promise((resolve, reject) => {
    renderFile(
      join(__dirname, '../templates/emails', `${template}.ejs`),
      data,
      (err: Error | null, str: string) => {
        if (err) reject(err);
        else resolve(str);
      }
    );
    });
  }

  async sendProjectCreationEmail(projectData: any) {
    const html = await this.renderTemplate('project-created', projectData);
    
    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.ADMIN_EMAIL,
      subject: 'New Project Created',
      html
    });
  }

  async sendTeamInvitationEmail(memberData: any) {
    const html = await this.renderTemplate('team-invitation', memberData);
    
    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: memberData.email,
      subject: `Invitation to Join ${memberData.projectTitle}`,
      html
    });
  }

  async sendProjectUpdateEmail(updateData: any) {
    const html = await this.renderTemplate('project-update', updateData);
    
    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: updateData.recipients,
      subject: `Project Update: ${updateData.projectTitle}`,
      html
    });
  }

  async sendMilestoneCompletionEmail(milestoneData: any) {
    const html = await this.renderTemplate('milestone-completed', milestoneData);
    
    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: milestoneData.recipients,
      subject: `Milestone Completed: ${milestoneData.projectTitle}`,
      html
    });
  }

  async sendProjectCompletionEmail(projectData: any) {
    const html = await this.renderTemplate('project-completed', projectData);
    
    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: projectData.recipients,
      subject: `Project Completed: ${projectData.projectTitle}`,
      html
    });
  }

  async sendFundingUpdateEmail(fundingData: any) {
    const html = await this.renderTemplate('funding-update', fundingData);
    
    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: fundingData.recipients,
      subject: `Funding Update: ${fundingData.projectTitle}`,
      html
    });
  }

  async sendProjectDeletionEmail(projectData: any) {
    const html = await this.renderTemplate('project-deleted', projectData);
    
    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: projectData.recipients,
      subject: `Project Deleted: ${projectData.projectTitle}`,
      html
    });
  }
}

export default new EmailService();