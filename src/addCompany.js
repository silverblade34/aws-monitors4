import middy from "@middy/core";
import { v4 as uuidv4 } from "uuid";
import jsonBodyParser from '@middy/http-json-body-parser'
import AWS from "aws-sdk"
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";

const addCompany = async (event) => {
    try {
        // const token = event.headers.Authorization || event.headers.authorization;

        // if (!token) {
        //     return {
        //         statusCode: 403,
        //         body: JSON.stringify({ message: "No autorizado" }),
        //     };
        // }

        // const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // if (decoded.role !== "MASTER") {
        //     return {
        //         statusCode: 403,
        //         body: JSON.stringify({ message: "No tienes permisos para realizar esta operación" }),
        //     };
        // }

        const dynamodb = new AWS.DynamoDB.DocumentClient()
        const id = uuidv4();
        const companyReceived = event.body;
        const passwordhash = await bcrypt.hash(companyReceived.password, 10);
        companyReceived.password = passwordhash;
        const company = { ...companyReceived, id }
        await dynamodb.put({
            TableName: "ms4companiesTable",
            Item: company
        }).promise()
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Se ha registrado la compañia correctamente", data: company }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: error.message, data: null }),
        };
    }
};

export const handler = middy(addCompany).use(jsonBodyParser());