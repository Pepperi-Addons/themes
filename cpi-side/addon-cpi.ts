import '@pepperi-addons/cpi-node'
import ThemesService from './themes-cpi.service';
// export const router = Router();

export async function load(configuration: any) {
    // console.log('cpi side works!');
    // Put your cpi side code here

    // Handle on get theme variables
    pepperi.events.intercept("GetThemeCssVariables" as any, {}, async (data): Promise<any> => {
        let res: any = null;

        const service = new ThemesService();
        res = await service.getThemeCssVariables(data.client);
        return res;
    });

}

// router.get('/get_theme', async (req, res) => {
//     let resObj = {}
    
    
//     res.json(resObj);
// });
