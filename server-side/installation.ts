import MyService from './my.service';
import {Client, Request} from '@pepperi-addons/debug-server';

export async function install(client: Client, request: Request) {
    try {
        const service = new MyService(client)
        await service.createRelationsAndInstallThemes();
    } catch (err) {
        throw new Error(`Failed to create ADAL Tables. error - ${err}`);
    }

    return { success: true, resultObject: {} };
}

export async function uninstall(client: Client, request: Request) {
    return {success: true, resultObject: {}};
}

export async function upgrade(client: Client, request: Request) {
    try {
        const service = new MyService(client)
        await service.createRelationsAndInstallThemes();
    } catch (err) {
        throw new Error(`Failed to create ADAL Tables. error - ${err}`);
    }

    return { success: true, resultObject: {} };
}

export async function downgrade(client: Client, request: Request) {
    return {success: true, resultObject: {}};
}
