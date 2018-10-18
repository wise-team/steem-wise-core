import * as winston from "winston";
import * as _ from "lodash";

/**
 * Logging levels in Wise conforms NPM logging levels
 */
export abstract class AbstractLog {
    private logger?: winston.Logger;
    private name: string;
    private verboseOutput: boolean = false;

    public constructor(name: string) {
        this.name = name;
    }

    public init(evaluateLevels: (string | undefined) []) {
        const definedLevels: string [] = evaluateLevels
            .filter(level => !!level)
            .map(level => level + "");

        const chosenLevels = winston.config.npm.levels;
        const availableLevelNames = _.keys(chosenLevels);
        definedLevels.forEach(level => {
            if (availableLevelNames.indexOf(level) === -1)
                throw new Error("Log.conffigureLogger fed with improper log level. "
                    + "Available levels: [ " + availableLevelNames.join(",") + " ]");
        });
        const mostVerboseLevel = definedLevels
            .reduce((prevLevel: string, currLevel: string) =>
            chosenLevels[currLevel] > chosenLevels[prevLevel] ? currLevel : prevLevel
            ) || "info";

        this.logger = winston.createLogger({
            levels: chosenLevels,
            level: mostVerboseLevel,
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
                        winston.format.printf(info => {
                            if (this.verboseOutput || chosenLevels[info.level] <= chosenLevels["verbose"]) {
                                return `${this.name} | ${info.timestamp} [${info.level}]: ${info.message}`;
                            }
                            else {
                                return `${this.name} | ${info.message}`;
                            }
                        })
                    ),
                    handleExceptions: true,
                    timestamp: true,
                } as object)
            ]
        });

            // if (logger.levels[logger.level] >= logger.levels[AbstractLog.level.verbose]) {
                console.log("log.level[\"" + this.name + "\"]=\"" + this.logger.level +  "\"");
                console.error("log.level[\"" + this.name + "\"]=\"" + this.logger.level +  "\"");
            // }
    }

    public setVerboseOutput(verboseOutput: boolean) {
        this.verboseOutput = verboseOutput;
    }

    public getLevel(): string {
        return this.getLogger().level;
    }

    public getName(): string {
        return this.name;
    }

    public cheapDebug(debugStringReturnerFn: () => string): void {
        const logger = this.getLogger();
        if (logger.levels[logger.level] >= logger.levels["debug"]) logger.debug(debugStringReturnerFn());
    }

    public isDebug() {
        const logger = this.getLogger();
        return logger.levels[logger.level] >= logger.levels["debug"];
    }

    public cheapInfo(infoStringReturnerFn: () => string): void {
        const logger = this.getLogger();
        if (logger.levels[logger.level] >= logger.levels["info"]) logger.debug(infoStringReturnerFn());
    }

    public promiseResolveDebug<T>(msgBeginning: string, result: T): T {
        this.cheapDebug(() => msgBeginning + JSON.stringify(result));
        return result;
    }

    public promiseRejectionDebug<T>(msgBeginning: string, error: T): T {
        this.cheapDebug(() => msgBeginning + JSON.stringify(error));
        throw error;
    }

    public static level = {
        error: "error",
        warn: "warn",
        info: "info",
        http: "http",
        verbose: "verbose",
        debug: "debug",
        silly: "silly"
    };

    public error(msg: string) {
        this.getLogger().error(msg);
    }

    public warn(msg: string) {
        this.getLogger().warn(msg);
    }

    public info(msg: string) {
        this.getLogger().info(msg);
    }

    public http(msg: string) {
        this.getLogger().http(msg);
    }

    public verbose(msg: string) {
        this.getLogger().verbose(msg);
    }

    public debug(msg: string) {
        this.getLogger().debug(msg);
    }

    public silly(msg: string) {
        this.getLogger().silly(msg);
    }

    public exception(level: string, error: Error): void {
        const logger = this.getLogger();
        logger.log(level, error.name + ": " + error.message
            + (logger.levels[logger.level] >= logger.levels["info"] && error.stack ? "\n" + error.stack : ""));
    }

    public json(level: string, object: object, pretty: boolean = false): void {
        const logger = this.getLogger();
        logger.log(level, (pretty ? JSON.stringify(object, undefined, 2) : JSON.stringify(object)));
    }

    private getLogger(): winston.Logger {
        if (!this.logger) this.init([]);
        if (!this.logger) throw new Error("Could not initialize logger");
        return this.logger;
    }
}