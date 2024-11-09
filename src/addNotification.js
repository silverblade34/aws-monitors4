import middy from "@middy/core";
import { v4 as uuidv4 } from "uuid";
import jsonBodyParser from '@middy/http-json-body-parser'
import AWS from "aws-sdk"

const addNotification = async (event) => {
    try {
        const dynamodb = new AWS.DynamoDB.DocumentClient()
        const id = uuidv4();
        const notificationReceived = event.body;
        const notification = {
            ...notificationReceived,
            id,
            state: 0,
            guid: notificationReceived.guid ? notificationReceived.guid : "",
            linkVideo: notificationReceived.linkVideo ? notificationReceived.linkVideo : "",
            linkImage: notificationReceived.linkImage ? notificationReceived.linkImage : "",
            attentions: []
        }
        await dynamodb.put({
            TableName: "ms4notificationTable",
            Item: notification
        }).promise()
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Se ha registrado la notificacion correctamente", data: notification }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: error.message, data: null }),
        };
    }
};

export const handler = middy(addNotification).use(jsonBodyParser());

