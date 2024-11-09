import middy from "@middy/core";
import jsonBodyParser from '@middy/http-json-body-parser'
import jwt from "jsonwebtoken";
import AWS from "aws-sdk"
import bcrypt from 'bcryptjs';


const login = async (event) => {
    try {
        const dynamodb = new AWS.DynamoDB.DocumentClient()
        const { username, password } = event.body;
        const params = {
            TableName: "ms4companiesTable",
            FilterExpression: "username = :username",
            ExpressionAttributeValues: {
                ":username": username,
            },
        };
        
        const result = await dynamodb.scan(params).promise();

        if (result.Items.length === 0) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: "Usuario no encontrado" }),
            };
        }
        const user = result.Items[0];

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: "Contraseña incorrecta" }),
            };
        }
        const token = generateToken(user);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Logueado correctamente", token: token }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: error.message, data: null }),
        };
    }
};

const generateToken = (user) => {
    const secretKey = process.env.JWT_SECRET;

    const payload = {
        id: user.id,
        username: user.username,
        role: user.role,
    };

    const token = jwt.sign(payload, secretKey, { expiresIn: '1h' });
    return token;
};


export const handler = middy(login).use(jsonBodyParser());