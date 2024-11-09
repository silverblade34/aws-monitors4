import middy from "@middy/core";
import jsonBodyParser from '@middy/http-json-body-parser'
import AWS from "aws-sdk"

const addNotification = async (event) => {
    try {
        const notification = event.body;
        return {
            statusCode: 200,
            body: JSON.stringify(notification),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: error.message }),
        };
    }
};

export const handler = middy(addNotification).use(jsonBodyParser());

