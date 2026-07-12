import type { Response } from "express";

interface SendResponseArgs<T> {
  statusCode?: number;
  success?: boolean;
  message: string;
  data?: T;
}

export const sendResponse = <T>(res: Response, args: SendResponseArgs<T>) => {
  res.status(args.statusCode || 200).json({
    success: args.success ?? true,
    message: args.message,
    data: args.data,
  });
};
