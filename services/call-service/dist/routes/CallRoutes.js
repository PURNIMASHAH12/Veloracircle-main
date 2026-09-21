"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const CallController_1 = require("../controllers/CallController");
const router = express_1.default.Router();
router.post("/", CallController_1.createCall);
router.get("/", CallController_1.getMyCalls);
router.patch("/:callId/status", CallController_1.updateCallStatus);
exports.default = router;
