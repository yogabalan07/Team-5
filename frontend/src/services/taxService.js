import { makeMasterService } from './masterCrud';

export const taxService = makeMasterService('taxes', ['name']);
export default taxService;