import express from "express"
import ApiManager from "./apiManager"
import RateLimiter from "./rate-limiter"

const app = express()

const apiManager = new ApiManager()
const rateLimiter = new RateLimiter({
  requestLimit: 2,
  timeFrameInSeconds: 5,
})

const router = express.Router()

router.route("/products").get(rateLimiter.dict_rate_limiter, apiManager.GetData)

app.listen(9000, () => {
  console.log("Server Runinng on 9000")
})
