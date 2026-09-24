// src/services/supplierGroupService.js
import { makeMasterService } from './masterCrud';

export const supplierGroupService = makeMasterService('supplierGroups', ['name']);
export default supplierGroupService;
