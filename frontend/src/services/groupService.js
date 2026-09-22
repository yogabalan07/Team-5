import { makeMasterService } from './masterCrud';

export const groupService = makeMasterService('itemGroups', ['name']);
export default groupService;