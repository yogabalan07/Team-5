import { makeMasterService } from './masterCrud';

export const brandService = makeMasterService('itemBrands', ['name']);
export default brandService;