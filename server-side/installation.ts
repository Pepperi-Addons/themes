import { ThemesService }  from './themes.service';
import {Client, Request} from '@pepperi-addons/debug-server';
import { ThemesUpgradeService } from './themes-upgrade.service';

export async function install(client: Client, request: Request) {
    try {
        const service = new ThemesService(client)
        await service.createRelationsAndInstallThemes();

        const upgradeService = new ThemesUpgradeService(client);
        await upgradeService.performMigration(request.body.FromVersion, request.body.ToVersion, false);
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
        const service = new ThemesService(client)
        await service.createRelationsAndInstallThemes();

        const upgradeService = new ThemesUpgradeService(client);
        await upgradeService.performMigration(request.body.FromVersion, request.body.ToVersion);

    } catch (err) {
        throw new Error(`Failed to create ADAL Tables. error - ${err}`);
    }

    return { success: true, resultObject: {} };
}

export async function downgrade(client: Client, request: Request) {
    return {success: true, resultObject: {}};
}
