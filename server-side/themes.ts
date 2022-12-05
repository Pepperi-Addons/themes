import MyService from './my.service';
import {Client, Request} from '@pepperi-addons/debug-server';

export async function css_variables(client: Client, request: Request) {
    try {
        const service = new MyService(client);
        const res = await service.getCssVariablesResultObject();
        return res;
    } catch(err) {
        throw err;
    }
}

export async function merged_data(client: Client, request: Request) {
    try {
        const service = new MyService(client);
        const res = await service.getMergedData();
        return res;
    } catch(err) {
        throw err;
    }
}

export async function save(client: Client, request: Request) {
    try {
        const body = request.body;
        const service = new MyService(client);
        const res = await service.saveTheme(body);
        return res;
    } catch(err) {
        throw err;
    }
}

export async function publish(client: Client, request: Request) {
    try {
        const body = request.body;
        const service = new MyService(client);
        const res = await service.publishTheme(body);
        return res;
    } catch(err) {
        throw err;
    }
}
