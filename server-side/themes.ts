import MyService from './my.service';
import JavascriptService from './my.javascript.service.js';
import {Client, Request} from '@pepperi-addons/debug-server';
import {InstalledAddon} from '@pepperi-addons/papi-sdk';

// add functions here
// this function will run on the 'api/foo' endpoint
// the real function is runnning on another typescript file
export async function foo(client: Client, request: Request) {
    const service = new MyService(client);
    const res = await service.getAddons();
    return res;
}

// this function will run on api/js_foo endpoint
// note that the code here is running from a javascript file
export async function js_foo(client: Client, request: Request) {
    return JavascriptService.js_foo(client, request);
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
