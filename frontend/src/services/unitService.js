import { makeMasterService } from './masterCrud';

export const unitService = makeMasterService('units', ['name', 'shortName']);
export default unitService;