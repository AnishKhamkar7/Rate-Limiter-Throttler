import { Request, Response, NextFunction } from "express"

interface RateLimitRequest {
  requestLimit: number
  timeFrameInSeconds: number
}

export default class RateLimiter {
  private requestLimit: number
  private timeFrameInSeconds: number
  private requestMap = new Map<string, { counter: number; startTime: number }>()

  constructor({ requestLimit, timeFrameInSeconds }: RateLimitRequest) {
    this.requestLimit = requestLimit
    this.timeFrameInSeconds = timeFrameInSeconds * 1000
  }

  dict_rate_limiter = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    const userId = req.ip || "unknown"

    const currentTime = Date.now()

    if (this.requestMap.has(userId)) {
      const userData = this.requestMap.get(userId)!

      if (currentTime - userData.startTime > this.timeFrameInSeconds) {
        this.requestMap.set(userId, { counter: 1, startTime: currentTime })
        return next()
      }

      if (userData.counter >= this.requestLimit) {
        res.status(429).json({
          message: "Too many requests. Please try again later.",
        })
      }

      userData.counter++
      this.requestMap.set(userId, userData)
    } else {
      this.requestMap.set(userId, { counter: 1, startTime: currentTime })
    }

    next()
  }
}
