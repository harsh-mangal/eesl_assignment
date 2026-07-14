import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { ApiError } from '../utils/api-error.js';

function replaceRequestProperty(request: Request, key: 'query' | 'params', value: unknown) {
  Object.defineProperty(request, key, {
    value,
    configurable: true,
    enumerable: true,
    writable: true,
  });
}

export const validate = (schema: ZodTypeAny) => {
  return (request: Request, _response: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: request.body,
      query: request.query,
      params: request.params,
    });

    if (!result.success) {
      return next(new ApiError(422, 'Validation failed.', result.error.flatten()));
    }

    const data = result.data as {
      body?: unknown;
      query?: unknown;
      params?: unknown;
    };
    if (data.body !== undefined) request.body = data.body;
    if (data.query !== undefined) replaceRequestProperty(request, 'query', data.query);
    if (data.params !== undefined) replaceRequestProperty(request, 'params', data.params);
    return next();
  };
};
