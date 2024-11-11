import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();

const connectNotification = async (event) => {
    const connectionId = event.requestContext.connectionId;

    const { role, user, codeCompany } = JSON.parse(event.body) || {};

    const params = {
        TableName: "ms4connectedUsers",
        Item: {
            connectionId,
            role,
            user,
            codeCompany,
            timestamp: new Date().toISOString(),
        },
    };

    try {
        await dynamodb.put(params).promise();
        console.log('Conexión guardada:', connectionId);
    } catch (error) {
        console.log('Error guardando conexión:', error);
    }

    return { statusCode: 200, body: 'Conexión gestionada correctamente' };
};

export const handler = connectNotification;
