import { ThemesService } from './themes.service';
import {Client, Request} from '@pepperi-addons/debug-server';

export async function themes(client: Client, request: Request): Promise<any> {
    try {
        const service = new ThemesService(client);
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
        const service = new ThemesService(client);
        let res = service.publishAddonTheme(request.body, request.header);
        return res;
    } catch(err) {
        throw err;
    }
}

export async function themes_variables(client:Client, request: Request): Promise<any> {
    try {
        const service = new ThemesService(client);
        let res;

        if (request.method === 'POST') {
            res = service.saveThemesVariables(request.body);
        } else if (request.method === 'GET') {
            res = service.getThemesVariables(request.query);
        } else {
            throw new Error(`Method ${request.method} is not supported.`);
        }

        return res;
    } catch(err) {
        throw err;
    }
}