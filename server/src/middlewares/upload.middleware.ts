import multer from 'multer';
import path from 'path';
import { Request } from 'express';

const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow images and common document types
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido'));
  }
};

// CORREÇÃO: Aumento significativo do limite de tamanho de arquivo
// Limite aumentado de 5MB para 100MB (104857600 bytes) para suportar anexos maiores
// O limite pode ser configurado via variável de ambiente MAX_FILE_SIZE
// Se não configurado, usa 100MB como padrão
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600'), // 100MB default (aumentado de 5MB)
  },
});

export const uploadMultiple = upload.array('files', 10); // Max 10 files

