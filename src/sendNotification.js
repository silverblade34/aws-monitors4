import middy from "@middy/core";
import { v4 as uuidv4 } from "uuid";
import jsonBodyParser from '@middy/http-json-body-parser'
import AWS from "aws-sdk"

const sendNotification = async (event) => {
    try {
        const dynamodb = new AWS.DynamoDB.DocumentClient()
        const apiGateway = new AWS.ApiGatewayManagementApi({ endpoint: event.requestContext.domainName + '/' });
        const id = uuidv4();
        const notificationReceived = event.body;
        const socket = ref(null);
        
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
        const currentTime = Math.floor(Date.now() / 1000);
        const ttl = currentTime + 60 * 60 * 24 * 30 * 2;

        // Configuracion test TTL 10 segundos
        // const currentTime = Math.floor(Date.now() / 1000);
        // const ttl = currentTime + 10;

        const notification = {
            ...notificationReceived,
            id,
            state: 0,
            guid: notificationReceived.guid || "",
            linkVideo: notificationReceived.linkVideo || "",
            linkImage: notificationReceived.linkImage || "",
            attentions: [],
            ttl,
        };
        delete notification.token;
        await dynamodb.put({
            TableName: "ms4notificationTable",
            Item: notification
        }).promise()

        const usersToNotify = await dynamodb.scan({
            TableName: "ms4connectedUsers",
        }).promise();

        await Promise.all(usersToNotify.Items.map(async (user) => {
            try {
                await apiGateway.postToConnection({
                    ConnectionId: user.connectionId,
                    Data: JSON.stringify({ message: "Nueva notificación", data: notification }),
                }).promise();
            } catch (error) {
                if (error.statusCode === 410) {
                    await dynamodb.delete({
                        TableName: "ms4connectedUsers",
                        Key: { connectionId: user.connectionId },
                    }).promise();
                }
            }
        }));

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

export const handler = middy(sendNotification).use(jsonBodyParser());

