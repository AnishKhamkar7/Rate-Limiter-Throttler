import express from "express"
import ApiManager from "./apiManager"
import RateLimiter from "./rate-limiter"

const app = express()
const router = express.Router()

const apiManager = new ApiManager()
const rateLimiter = new RateLimiter({
  requestLimit: 2,
  timeFrameInSeconds: 5,
})

app.use("/", router)
router.use(rateLimiter.dict_rate_limiter)
router.get("/products", apiManager.GetData)

app.listen(9000, () => {
  console.log("Server Runinng on 9000")
})
