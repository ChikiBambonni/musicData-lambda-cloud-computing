import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);
const tableName = 'musicData';

const getItem = (id?: string) => {
  return dynamo.send(new GetCommand({ TableName: tableName, Key: { id } }));
};

const getAllItems = () => {
  return dynamo.send(new ScanCommand({ TableName: tableName }));
};

export const handler = async (
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Content-Type': 'application/json',
  };
  const itemId = event.pathParameters?.id;
  // @ts-ignore
  const routeKey = event.routeKey;

  try {
    const body = (async () => {
      switch (routeKey) {
        case 'GET /items':
          return (await getAllItems()).Items;
        case 'GET /items/{id}':
          return (await getItem(itemId)).Item;
        default: {
          throw new Error(`Unsupported route: "${routeKey}"`);
        }
      }
    })();

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: await body,
        date: new Date().toISOString(),
      }),
      headers,
    };
  } catch (err: any) {
    return {
      statusCode: 400,
      body: JSON.stringify(err.message),
      headers,
    };
  }
};
