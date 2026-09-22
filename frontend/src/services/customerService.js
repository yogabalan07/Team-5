import { makePartyService } from './partyCrud';

export const customerService = makePartyService({
  collectionName: 'customers',
  creditEnabled: true,
  softDelete: true,
});

export default customerService;