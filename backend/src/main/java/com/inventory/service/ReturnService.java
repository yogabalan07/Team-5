package com.inventory.service;

import com.inventory.dto.request.SalesReturnRequest;
import com.inventory.dto.request.PurchaseReturnRequest;
import com.inventory.dto.response.SalesReturnResponse;
import com.inventory.dto.response.PurchaseReturnResponse;

import java.util.List;

public interface ReturnService {
    // Sales Return methods
    SalesReturnResponse createSalesReturn(SalesReturnRequest request);
    SalesReturnResponse getSalesReturnByReturnNo(String returnNo);
    List<SalesReturnResponse> getSalesReturnsByInvoice(String invoiceNo);

    // Purchase Return methods
    PurchaseReturnResponse createPurchaseReturn(PurchaseReturnRequest request);
    PurchaseReturnResponse getPurchaseReturnByReturnNo(String returnNo);
    List<PurchaseReturnResponse> getPurchaseReturnsByInvoice(String invoiceNo);
}