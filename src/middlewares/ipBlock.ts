import { NextFunction, Request, Response } from "express";
import { isIpBlocked } from "../lib/ipBlocklist";

const ipBlock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const ip = req.ip ?? req.socket.remoteAddress ?? "";

  if (!ip) {
    next();
    return;
  }

  const blocked = await isIpBlocked(ip);

  if (blocked) {
    res.status(403).json({
      success: false,
      message: "Your IP address has been blocked",
      errors: [],
    });
    return;
  }

  next();
};

export default ipBlock;
