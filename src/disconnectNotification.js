import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();

const disconnectNotification = async (event) => {
  const connectionId = event.requestContext.connectionId;

  const params = {
    TableName: "ms4connectedUsers",
    Key: {
      connectionId,
    },
  };

  try {
    await dynamodb.delete(params).promise();
    console.log('Conexión eliminada:', connectionId);
  } catch (error) {
    console.log('Error eliminando conexión:', error);
  }

  return { statusCode: 200, body: 'Desconexión gestionada correctamente' };
};

export const handler = disconnectNotification;
