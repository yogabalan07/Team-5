// src/services/priceListService.js
import { makeMasterService } from './masterCrud';

export const priceListService = makeMasterService('priceLists', ['name']);
export default priceListService;
