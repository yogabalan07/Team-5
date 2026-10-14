// src/services/customerGroupService.js
import { makeMasterService } from './masterCrud';

export const customerGroupService = makeMasterService('customerGroups', ['name']);
export default customerGroupService;
