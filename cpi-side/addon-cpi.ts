import '@pepperi-addons/cpi-node'
import ThemesService from './themes-cpi.service';
export const router = Router();

export async function load(configuration: any) {
    // console.log('cpi side works!');
    // Put your cpi side code here

    // Handle on get theme variables
    pepperi.events.intercept("GetThemeCssVariables" as any, {}, async (data): Promise<any> => {
        let res: any = null;

        const service = new ThemesService();
        res = await service.getThemePublishedObject('cssVariables', data.client);
        return res;
    });

}

router.get("/themes/:key", async (req, res) => {
    let result = {};
    
    try {
        // const themeKey = req.query['key']?.toString();
        console.log("CPISide - GET theme with query params (theme key)");
        const service = new ThemesService();
        result = await service.getThemePublishedObject(req.params.key);

    } catch(exception) {
        // Handle exception.
    }

    res.json(result || {});
});

router.get("/themes", async (req, res) => {
    let result = {};
    
    try {
        console.log("CPISide - GET theme (the whole theme object)");
        const service = new ThemesService();
        result = await service.getThemePublishedObject();

    } catch(exception) {
        // Handle exception.
    }

    res.json(result || {});
});

// router.get('/get_theme', async (req, res) => {
//     let resObj = {}
    
//     const service = new ThemesService();
//     res = await service.getThemeCssVariables(themeKey);

//     res.json(resObj);
// });
