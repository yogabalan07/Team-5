import { makePartyService } from './partyCrud';

export const supplierService = makePartyService({
  collectionName: 'suppliers',
  creditEnabled: false,
  softDelete: false,
});

export default supplierService;