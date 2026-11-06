import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UnsupportedMediaTypeException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { RequirePermission } from '../../../shared/decorators/require-permission.decorator';
import { PERMISSION_KEYS } from '../../identity/domain/constants/permissions.constants';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
// `process.cwd()` is `apps/api` under every run mode this project uses
// (`nest start`, `node dist/main.js`), matching the static mount in
// main.ts — stays outside `src`/`dist` so a rebuild never touches it.
const UPLOAD_DIR = join(process.cwd(), 'uploads', 'products');

if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Local-disk file upload for product media. A stand-in for the
 * Cloudinary adapter planned in docs/02-FOLDER-STRUCTURE.md — returns a
 * public URL the existing Media tab form (url + altText + colorId) can
 * use as-is, so swapping in Cloudinary later only touches this file.
 */
@ApiTags('Catalog — Product Media')
@ApiBearerAuth('access-token')
@Controller('catalog/media')
export class MediaUploadController {
  @Post('uploads')
  @RequirePermission(PERMISSION_KEYS.PRODUCTS_MANAGE)
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse({
    description: 'File stored on local disk; public URL returned.',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, callback) => {
          callback(null, `${randomUUID()}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
          callback(
            new UnsupportedMediaTypeException(
              'Only JPEG, PNG, WEBP or GIF images are allowed.',
            ),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ): { url: string } {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }
    return {
      url: `${req.protocol}://${req.get('host')}/uploads/products/${file.filename}`,
    };
  }
}
