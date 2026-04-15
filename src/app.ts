import 'reflect-metadata';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as bodyParser from 'body-parser';
import * as path from 'path';
import * as fs from 'fs';
import routes from './routes/index.routes';
import docsRouter from './routes/docs.routes';
import { errorMiddleware } from './middleware/error.middleware';
import { requestIdMiddleware } from './middleware/request-id.middleware';
import { helmetMiddleware } from './middleware/helmet.middleware';
import { globalRateLimiter } from './middleware/rate-limit.middleware';
import { NotFoundError } from './utils/errors';
import appConfig from './config/app.config';

dotenv.config();

const app = express();

app.use(helmetMiddleware);

const staticDirCandidates = [
  path.join(process.cwd(), 'public'),
  path.join(__dirname, 'public'),
  path.join(__dirname, '..', 'public'),
  path.join(__dirname, '..', '..', 'public'),
];
const staticDir = staticDirCandidates.find((dir) => fs.existsSync(dir));

if (staticDir) {
  app.use(express.static(staticDir));
}

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  cors({
    origin: appConfig.cors.origin,
    credentials: true,
  })
);

app.use(globalRateLimiter);

app.use(requestIdMiddleware);

app.use('/api-docs', docsRouter);

app.use('/api', routes);

app.use((req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError(`Route ${req.method} ${req.url} not found`);
  next(error);
});

app.use(errorMiddleware);

export default app;
