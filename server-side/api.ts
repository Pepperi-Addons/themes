import MyService from './my.service';
import {Client, Request} from '@pepperi-addons/debug-server';

export async function themes(client: Client, request: Request): Promise<any> {
    try {
        const service = new MyService(client);
        let res;

        if (request.method === 'POST') {
            res = service.saveAddonTheme(request.body, request.header);
        } else if (request.method === 'GET') {
            res = service.getAddonTheme(request.query);
        } else {
            throw new Error(`Method ${request.method} is not supported.`);
        }

        return res;
    } catch(err) {
        throw err;
    }
}

export async function publish(client: Client, request: Request): Promise<any> {
    try {
        const service = new MyService(client);
        let res = service.publishAddonTheme(request.body, request.header);
        return res;
    } catch(err) {
        throw err;
    }
}