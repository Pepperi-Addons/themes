import MyService from './my.service';
import {Client, Request} from '@pepperi-addons/debug-server';

export async function install(client: Client, request: Request) {
    const service = new MyService(client);
    const res = await service.installTheme();
    return res;
}

export async function uninstall(client: Client, request: Request) {
    return {success: true, resultObject: {}};
}

export async function upgrade(client: Client, request: Request) {
    return {success: true, resultObject: {}};
}

export async function downgrade(client: Client, request: Request) {
    return {success: true, resultObject: {}};
}
