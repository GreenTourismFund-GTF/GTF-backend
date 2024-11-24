import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import crypto from 'crypto';

// Configure AWS S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Process and upload image to S3
async function uploadToS3(buffer: Buffer, originalname: string): Promise<string> {
  const filename = `${crypto.randomBytes(16).toString('hex')}-${originalname}`;
  
  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: `project-images/${filename}`,
    Body: buffer,
    ContentType: 'image/webp',
    ACL: 'public-read'
  }));

  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/project-images/${filename}`;
}

interface MulterRequest extends Request {
  files?: Express.Multer.File[];
}

export const uploadImages = async (req: MulterRequest, res: Response, next: NextFunction) => {
  try {
    // Handle multiple image uploads
    const uploadMiddleware = upload.array('images', 10);
    
    uploadMiddleware(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          error: err.message
        });
      }

      if (!req.files?.length) {
        return next();
      }

      const files = req.files as Express.Multer.File[];
      const uploadPromises = files.map(async (file) => {
        // Optimize image
        const optimizedBuffer = await sharp(file.buffer)
          .resize(1200, 1200, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({ quality: 80 })
          .toBuffer();

        // Upload to S3
        return uploadToS3(optimizedBuffer, file.originalname);
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      
      // Add uploaded URLs to request body
      req.body.images = uploadedUrls;
      next();
    });
  } catch (error) {
    next(error);
  }
};