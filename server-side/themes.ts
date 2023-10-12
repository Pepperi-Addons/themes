import MyService from './my.service';
import {Client, Request} from '@pepperi-addons/debug-server';

export async function css_variables(client: Client, request: Request) {
    try {
        const service = new MyService(client);
        const res = await service.getCssVariablesResultObject(request?.query);
        return res;
    } catch(err) {
        throw err;
    }
}

export async function get_published_theme(client: Client, request: Request) {
    try {
        const service = new MyService(client);
        const res = await service.getPublishedThemeObject(request?.query);
        return res;
    } catch(err) {
        throw err;
    }
}

export async function get_pepperi_theme(client: Client, request: Request) {
    try {
        const service = new MyService(client);
        const res = await service.getPepperiTheme(request?.query);
        return res;
    } catch(err) {
        throw err;
    }
}

export async function get_addons_themes(client: Client, request: Request) {
    try {
        const service = new MyService(client);
        const res = await service.getAddonsThemes(request?.query);
        return res;
    } catch(err) {
        throw err;
    }
}

export async function save_pepperi_theme(client: Client, request: Request) {
    try {
        const body = request.body;
        const service = new MyService(client);
        const res = await service.savePepperiTheme(body);
        return res;
    } catch(err) {
        throw err;
    }
}

export async function save_addon_theme(client: Client, request: Request) {
    try {
        const body = request.body;
        const service = new MyService(client);
        const res = await service.saveAddonThemeFromEditor(body);
        return res;
    } catch(err) {
        throw err;
    }
}

export async function publish_themes(client: Client, request: Request) {
    try {
        const body = request.body;
        const service = new MyService(client);
        const res = await service.publishThemes(body);
        return res;
    } catch(err) {
        throw err;
    }
}

export async function get_pepperi_theme_variables(client: Client, request: Request) {
    try {
        const service = new MyService(client);
        const res = await service.getThemesVariables(request?.query);
        return res;
    } catch(err) {
        throw err;
    }
}
