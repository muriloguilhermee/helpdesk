import { Request, Response } from 'express';

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.path,
  });
};

