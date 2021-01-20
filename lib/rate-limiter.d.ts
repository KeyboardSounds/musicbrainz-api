export declare class RateLimiter {
    private maxCalls;
    static sleep(ms: any): Promise<void>;
    queue: number[];
    private readonly period;
    constructor(period: number, maxCalls: number);
    limit(): Promise<void>;
}
