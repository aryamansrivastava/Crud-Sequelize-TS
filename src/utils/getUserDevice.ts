import { Request } from 'express';

export const getUserDevice = (req: Request): string => {
  const userAgent = req.headers['user-agent'] || '';
  const mobileRegex = /Mobile|Android|iP(hone|od|ad)|BlackBerry|IEMobile|Opera Mini/i;
  const tabletRegex = /iPad|Tablet|Kindle|PlayBook|Nexus/i;

  if (tabletRegex.test(userAgent)) {
    return 'Tablet';
  } else if (mobileRegex.test(userAgent)) {
    return 'Mobile';
  } else {
    return 'Desktop';
  }
};