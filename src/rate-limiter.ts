import { Request, Response, NextFunction } from "express"

interface RateLimitRequest {
  requestLimit: number
  timeFrameInSeconds: number
}

export default class RateLimiter {
  private requestLimit
  private timeFrameInSeconds
  private requestMap = new Map<string, { counter: number; startTime: number }>()

  constructor({ requestLimit, timeFrameInSeconds }: RateLimitRequest) {
    this.requestLimit = requestLimit
    this.timeFrameInSeconds = timeFrameInSeconds * 1000
  }

  dict_rate_limiter = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const userId = req.ip!

    const currentTime = Date.now()

    if (this.requestMap.has(userId)) {
      const userData = this.requestMap.get(userId)!

      if (currentTime - userData.startTime > this.timeFrameInSeconds) {
        this.requestMap.set(userId, { counter: 1, startTime: currentTime })
        next()
      } else {
        if (userData.counter >= this.requestLimit) {
          res.status(429).json({
            message: "Too many request. Please try again",
          })
        }

        userData.counter++
        this.requestMap.set(userId, userData)

        next()
      }
    } else {
      this.requestMap.set(userId, { counter: 1, startTime: currentTime })

      next()
    }
  }
}
