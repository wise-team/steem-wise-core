/**
 * Allows JSON import. From: https://hackernoon.com/import-json-into-typescript-8d465beded79
 */
declare module "*.json" {
    const value: any;
    export default value;
}