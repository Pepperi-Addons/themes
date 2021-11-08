import MyService from './my.service';
import {Client, Request} from '@pepperi-addons/debug-server';

// add functions here
// this function will run on the 'api/foo' endpoint
// the real function is runnning on another typescript file
export async function foo(client: Client, request: Request) {
    const service = new MyService(client);
    const res = await service.getAddons();
    return res;
}

export async function css_variables(client: Client, request: Request) {
    const service = new MyService(client);
    const res = await service.getCssVariables();
    return res;
}

export async function publish(client: Client, request: Request) {
    const body = request.body;
    const service = new MyService(client);
    const res = await service.publishTheme(body);
    return res;
}
