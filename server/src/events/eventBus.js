import EventEmitter from "events";
import { logger } from "../config/logger.js";

class AppEventBus extends EventEmitter {
  emit(event, ...args) {
    logger.debug(`[EventBus] Event emitted: ${event}`);
    return super.emit(event, ...args);
  }
}

export const eventBus = new AppEventBus();
