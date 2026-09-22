import { makeMasterService } from './masterCrud';

export const sectionService = makeMasterService('itemSections', ['name']);
export default sectionService;