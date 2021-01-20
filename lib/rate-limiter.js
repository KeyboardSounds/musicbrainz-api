"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = void 0;
const Debug = require("debug");
const debug = Debug('musicbrainz-api:rate-limiter');
class RateLimiter {
    constructor(period, maxCalls) {
        this.maxCalls = maxCalls;
        this.queue = [];
        this.period = 1000 * period;
    }
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async limit() {
        let now = new Date().getTime();
        const t0 = now - (this.period);
        while (this.queue.length > 0 && this.queue[0] < t0) {
            this.queue.shift();
        }
        if (this.queue.length >= this.maxCalls) {
            const delay = this.queue[0] + this.period - now;
            debug(`Client side rate limiter activated: cool down for ${delay / 1000} s...`);
            return RateLimiter.sleep(delay);
        }
        now = new Date().getTime();
        this.queue.push(now);
        // const ratePerSec = 1000 * this.queue.length / (now - this.queue[0]);
    }
}
exports.RateLimiter = RateLimiter;
//# sourceMappingURL=rate-limiter.js.map