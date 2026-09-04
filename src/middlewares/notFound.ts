import { Request, Response } from "express";

const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    errors: [{ path: req.originalUrl, message: "Not found" }],
  });
};

export default notFound;
