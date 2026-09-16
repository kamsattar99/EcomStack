import { Router, type IRouter } from "express";
import healthRouter from "./health";
import publicRouter from "./public";
import claimsRouter from "./claims";
import adminRouter from "./admin";
import assetsRouter from "./assets";

const router: IRouter = Router();

router.use(healthRouter);
router.use(publicRouter);
router.use(claimsRouter);
router.use(assetsRouter);
router.use(adminRouter);

export default router;
