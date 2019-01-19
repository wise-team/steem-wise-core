import { expect, use as chaiUse } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import "mocha";
import * as _ from "lodash";
chaiUse(chaiAsPromised);

import { CustomError } from "./CustomError";

describe("CustomError", () => {
    class ACustomError extends CustomError {
        public constructor(msg: string, cause?: Error) {
            super(msg, cause);
        }
    }

    class BCustomError extends CustomError {
        public constructor(msg: string, cause?: Error) {
            super(msg, cause);
        }
    }

    class CCustomError extends CustomError {
        public constructor(msg: string, cause?: Error) {
            super(msg, cause);
        }
    }

    describe("with single cause", () => {
        function thrower() {
            throw new ACustomError("Error in thrower");
        }

        function rethrower() {
            try {
                thrower();
            } catch (error) {
                throw new BCustomError("Error in rethrower", error);
            }
        }

        it("cause is instance of specified error", () => {
            expect(rethrower)
                .to.throw(BCustomError)
                .with.property("cause");
        });

        it("stack contains cause with it's stack", () => {
            expect(rethrower)
                .to.throw(BCustomError)
                .with.property("stack")
                .that.include("Caused by: ACustomError");
        });
    });

    describe("with stacked causes", () => {
        function thrower() {
            throw new ACustomError("Error in thrower");
        }

        function rethrower1() {
            try {
                thrower();
            } catch (error) {
                throw new BCustomError("Error in rethrower1", error);
            }
        }

        function rethrower2() {
            try {
                rethrower1();
            } catch (error) {
                throw new CCustomError("Error in rethrower2", error);
            }
        }

        it("stack contains two causes with it's stack", () => {
            expect(rethrower2)
                .to.throw(CCustomError)
                .with.property("stack")
                .that.include("Caused by: ACustomError")
                .and.include("Caused by: BCustomError");
        });
    });
});
