import middy from "@middy/core";
import { v4 as uuidv4 } from "uuid";
import jsonBodyParser from '@middy/http-json-body-parser'
import AWS from "aws-sdk"

const addNotification = async (event) => {
    try {
        const dynamodb = new AWS.DynamoDB.DocumentClient()
        const id = uuidv4();
        const notificationReceived = event.body;

        if (notificationReceived.token === "") {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: "El token no puede estar vacio" }),
            };
        }
        const params = {
            TableName: "ms4companiesTable",
            FilterExpression: "#token = :token",
            ExpressionAttributeNames: {
                "#token": "token" // Definimos el alias para el atributo 'token'
            },
            ExpressionAttributeValues: {
                ":token": notificationReceived.token,
            },
        };

        const result = await dynamodb.scan(params).promise();
        if (result.Items.length === 0) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: "El token no es valido" }),
            };
        }
        const notification = {
            ...notificationReceived,
            id,
            state: 0,
            guid: notificationReceived.guid ? notificationReceived.guid : "",
            linkVideo: notificationReceived.linkVideo ? notificationReceived.linkVideo : "",
            linkImage: notificationReceived.linkImage ? notificationReceived.linkImage : "",
            attentions: []
        }
        delete notification.token;
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

