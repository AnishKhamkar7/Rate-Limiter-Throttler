import { Request, Response, NextFunction } from "express"

interface RateLimitRequest {
  requestLimit: number
  timeFramePerUser: number
  throttleLimit: number
  timeFrameThrottle: number
}

export default class RateLimiter {
  private throttleLimit: number
  private requestLimit: number
  private timeFramePerUser: number
  private requestMap = new Map<string, { counter: number; startTime: number }>()
  private timeFrameThrottle: number
  private queue: { startTime: number }[] = []

  constructor({
    requestLimit,
    timeFramePerUser,
    throttleLimit,
    timeFrameThrottle,
  }: RateLimitRequest) {
    this.requestLimit = requestLimit
    this.timeFramePerUser = timeFramePerUser * 1000
    this.throttleLimit = throttleLimit
    this.timeFrameThrottle = timeFrameThrottle * 1000

    setInterval(() => this.userMapCleanUp(), 5 * 60 * 1000)
  }

  private globalCleanUp() {}

  private userMapCleanUp() {
    const now = Date.now()
    for (const [userId, userData] of this.requestMap.entries()) {
      if (now - userData.startTime > this.timeFramePerUser) {
        this.requestMap.delete(userId)
      }
    }
  }

  dict_rate_limiter = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    const userId = req.ip || "unknown"

    const currentTime = Date.now()

    this.globalCleanUp()

    if (this.queue.length > this.throttleLimit) {
      res.status(429).json({
        message: "Server is busy",
      })
    }

    this.queue.push({ startTime: currentTime })

    if (this.requestMap.has(userId)) {
      const userData = this.requestMap.get(userId)!

      if (currentTime - userData.startTime > this.timeFramePerUser) {
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
