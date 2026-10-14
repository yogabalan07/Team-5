// src/services/categoryService.js
import { makeMasterService } from './masterCrud';

export const categoryService = makeMasterService('categories', ['name']);
export default categoryService;
