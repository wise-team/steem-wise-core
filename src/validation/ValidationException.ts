export class ValidationException {
    public validationException: true = true;
    public message: string;

    constructor(message: string) {
        this.message = message;
    }
}