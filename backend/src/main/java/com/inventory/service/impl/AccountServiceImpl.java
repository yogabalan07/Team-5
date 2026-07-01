package com.inventory.service.impl;

import com.inventory.dto.request.BillReceiptRequest;
import com.inventory.dto.request.BillPaymentRequest;
import com.inventory.dto.response.BillReceiptResponse;
import com.inventory.dto.response.BillPaymentResponse;
import com.inventory.enums.PaymentType;
import com.inventory.exception.BusinessException;
import com.inventory.exception.ResourceNotFoundException;
import com.inventory.model.*;
import com.inventory.repository.*;
import com.inventory.service.AccountService;
import com.inventory.util.InvoiceGenerator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class AccountServiceImpl implements AccountService {

    @Autowired
    private BillReceiptRepository billReceiptRepository;

    @Autowired
    private BillPaymentRepository billPaymentRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private SalesInvoiceRepository salesInvoiceRepository;

    @Autowired
    private PurchaseInvoiceRepository purchaseInvoiceRepository;

    @Autowired
    private InvoiceGenerator invoiceGenerator;

    // ==================== BILL RECEIPT METHODS ====================

    @Override
    public BillReceiptResponse createBillReceipt(BillReceiptRequest request) {
        // Validate customer
        Customer customer = customerRepository.findById(request.getCustomerId())
            .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + request.getCustomerId()));

        // Validate invoice
        SalesInvoice invoice = salesInvoiceRepository.findById(request.getInvoiceId())
            .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + request.getInvoiceId()));

        // Validate payment amount
        if (request.getAdjustAmount().compareTo(invoice.getBalanceAmount()) > 0) {
            throw new BusinessException("Adjust amount cannot exceed balance amount. Balance: " + 
                invoice.getBalanceAmount() + ", Adjust: " + request.getAdjustAmount());
        }

        if (request.getAdjustAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Adjust amount must be greater than zero");
        }

        // Create receipt
        BillReceipt receipt = new BillReceipt();
        
        // Generate receipt number
        String todayPrefix = "REC-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        Integer maxNumber = billReceiptRepository.getMaxReceiptNumber(todayPrefix);
        int sequence = (maxNumber == null) ? 1 : maxNumber + 1;
        receipt.setReceiptNo(invoiceGenerator.generateReceiptNumber(sequence));
        
        receipt.setReceiptDate(request.getReceiptDate() != null ? request.getReceiptDate() : LocalDate.now());
        receipt.setCustomer(customer);
        receipt.setSalesInvoice(invoice);
        receipt.setTotalAmount(invoice.getBalanceAmount());
        receipt.setAdjustAmount(request.getAdjustAmount());
        
        BigDecimal newBalance = invoice.getBalanceAmount().subtract(request.getAdjustAmount());
        receipt.setBalanceAmount(newBalance);
        receipt.setPaymentMode(PaymentType.valueOf(request.getPaymentMode()));
        receipt.setReferenceNo(request.getReferenceNo());
        receipt.setNotes(request.getNotes());

        // Update invoice paid amount and balance
        invoice.setPaidAmount(invoice.getPaidAmount().add(request.getAdjustAmount()));
        invoice.setBalanceAmount(newBalance);
        salesInvoiceRepository.save(invoice);

        // Update customer credit balance
        customer.setCreditBalance(customer.getCreditBalance().subtract(request.getAdjustAmount()));
        customerRepository.save(customer);

        BillReceipt saved = billReceiptRepository.save(receipt);
        System.out.println("✅ Receipt created: " + saved.getReceiptNo() + " | Amount: " + saved.getAdjustAmount());
        
        return convertToResponse(saved);
    }

    @Override
    public BillReceiptResponse getBillReceiptByReceiptNo(String receiptNo) {
        BillReceipt receipt = billReceiptRepository.findByReceiptNo(receiptNo)
            .orElseThrow(() -> new ResourceNotFoundException("Receipt not found: " + receiptNo));
        return convertToResponse(receipt);
    }

    @Override
    public Page<BillReceiptResponse> getAllBillReceipts(Pageable pageable) {
        return billReceiptRepository.findAll(pageable)
            .map(this::convertToResponse);
    }

    @Override
    public Page<BillReceiptResponse> getBillReceiptsByDateRange(String startDate, String endDate, Pageable pageable) {
        LocalDate start = LocalDate.parse(startDate, DateTimeFormatter.ISO_LOCAL_DATE);
        LocalDate end = LocalDate.parse(endDate, DateTimeFormatter.ISO_LOCAL_DATE);
        return billReceiptRepository.findByDateRange(start, end, pageable)
            .map(this::convertToResponse);
    }

    @Override
    public List<BillReceiptResponse> getBillReceiptsByCustomer(Long customerId) {
        return billReceiptRepository.findByCustomerId(customerId)
            .stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }

    // ==================== BILL PAYMENT METHODS ====================

    @Override
    public BillPaymentResponse createBillPayment(BillPaymentRequest request) {
        // Validate supplier
        Supplier supplier = supplierRepository.findById(request.getSupplierId())
            .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + request.getSupplierId()));

        // Validate invoice
        PurchaseInvoice invoice = purchaseInvoiceRepository.findById(request.getInvoiceId())
            .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + request.getInvoiceId()));

        // Validate payment amount
        if (request.getAdjustAmount().compareTo(invoice.getBalanceAmount()) > 0) {
            throw new BusinessException("Adjust amount cannot exceed balance amount. Balance: " + 
                invoice.getBalanceAmount() + ", Adjust: " + request.getAdjustAmount());
        }

        if (request.getAdjustAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Adjust amount must be greater than zero");
        }

        // Create payment
        BillPayment payment = new BillPayment();
        
        // Generate payment number
        String todayPrefix = "PAY-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        Integer maxNumber = billPaymentRepository.getMaxPaymentNumber(todayPrefix);
        int sequence = (maxNumber == null) ? 1 : maxNumber + 1;
        payment.setPaymentNo(invoiceGenerator.generatePaymentNumber(sequence));
        
        payment.setPaymentDate(request.getPaymentDate() != null ? request.getPaymentDate() : LocalDate.now());
        payment.setSupplier(supplier);
        payment.setPurchaseInvoice(invoice);
        payment.setTotalAmount(invoice.getBalanceAmount());
        payment.setAdjustAmount(request.getAdjustAmount());
        
        BigDecimal newBalance = invoice.getBalanceAmount().subtract(request.getAdjustAmount());
        payment.setBalanceAmount(newBalance);
        payment.setPaymentMode(PaymentType.valueOf(request.getPaymentMode()));
        payment.setReferenceNo(request.getReferenceNo());
        payment.setNotes(request.getNotes());

        // Update invoice paid amount and balance
        invoice.setPaidAmount(invoice.getPaidAmount().add(request.getAdjustAmount()));
        invoice.setBalanceAmount(newBalance);
        purchaseInvoiceRepository.save(invoice);

        // Update supplier credit balance
        supplier.setCreditBalance(supplier.getCreditBalance().subtract(request.getAdjustAmount()));
        supplierRepository.save(supplier);

        BillPayment saved = billPaymentRepository.save(payment);
        System.out.println("✅ Payment created: " + saved.getPaymentNo() + " | Amount: " + saved.getAdjustAmount());
        
        return convertToResponse(saved);
    }

    @Override
    public BillPaymentResponse getBillPaymentByPaymentNo(String paymentNo) {
        BillPayment payment = billPaymentRepository.findByPaymentNo(paymentNo)
            .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + paymentNo));
        return convertToResponse(payment);
    }

    @Override
    public Page<BillPaymentResponse> getAllBillPayments(Pageable pageable) {
        return billPaymentRepository.findAll(pageable)
            .map(this::convertToResponse);
    }

    @Override
    public Page<BillPaymentResponse> getBillPaymentsByDateRange(String startDate, String endDate, Pageable pageable) {
        LocalDate start = LocalDate.parse(startDate, DateTimeFormatter.ISO_LOCAL_DATE);
        LocalDate end = LocalDate.parse(endDate, DateTimeFormatter.ISO_LOCAL_DATE);
        return billPaymentRepository.findByDateRange(start, end, pageable)
            .map(this::convertToResponse);
    }

    @Override
    public List<BillPaymentResponse> getBillPaymentsBySupplier(Long supplierId) {
        return billPaymentRepository.findBySupplierId(supplierId)
            .stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }

    // ==================== LEDGER METHODS ====================

    @Override
    public List<Map<String, Object>> getCustomerLedger(Long customerId) {
        List<Map<String, Object>> ledger = new ArrayList<>();
        
        // Verify customer exists
        if (!customerRepository.existsById(customerId)) {
            throw new ResourceNotFoundException("Customer not found with id: " + customerId);
        }
        
        // Get all invoices for customer
        List<SalesInvoice> invoices = salesInvoiceRepository.findByCustomerId(customerId);
        for (SalesInvoice invoice : invoices) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("date", invoice.getInvoiceDate());
            entry.put("type", "Invoice");
            entry.put("invoiceNo", invoice.getInvoiceNo());
            entry.put("amount", invoice.getNetAmount());
            entry.put("payment", BigDecimal.ZERO);
            entry.put("balance", invoice.getBalanceAmount());
            entry.put("description", "Sales Invoice - " + invoice.getInvoiceNo());
            ledger.add(entry);
        }

        // Get all receipts for customer
        List<BillReceipt> receipts = billReceiptRepository.findByCustomerId(customerId);
        for (BillReceipt receipt : receipts) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("date", receipt.getReceiptDate());
            entry.put("type", "Receipt");
            entry.put("invoiceNo", receipt.getSalesInvoice().getInvoiceNo());
            entry.put("amount", BigDecimal.ZERO);
            entry.put("payment", receipt.getAdjustAmount());
            entry.put("balance", receipt.getBalanceAmount());
            entry.put("description", "Payment Received - " + receipt.getReceiptNo());
            ledger.add(entry);
        }

        // Sort by date
        ledger.sort((a, b) -> ((LocalDate) a.get("date")).compareTo((LocalDate) b.get("date")));
        return ledger;
    }

    @Override
    public List<Map<String, Object>> getSupplierLedger(Long supplierId) {
        List<Map<String, Object>> ledger = new ArrayList<>();
        
        // Verify supplier exists
        if (!supplierRepository.existsById(supplierId)) {
            throw new ResourceNotFoundException("Supplier not found with id: " + supplierId);
        }
        
        // Get all purchase invoices for supplier
        // NEW CODE (CORRECT)
List<PurchaseInvoice> invoices = purchaseInvoiceRepository.findBySupplierId(supplierId, Pageable.unpaged()).getContent();
        for (PurchaseInvoice invoice : invoices) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("date", invoice.getInvoiceDate());
            entry.put("type", "Purchase Invoice");
            entry.put("invoiceNo", invoice.getInvoiceNo());
            entry.put("amount", invoice.getNetAmount());
            entry.put("payment", BigDecimal.ZERO);
            entry.put("balance", invoice.getBalanceAmount());
            entry.put("description", "Purchase Invoice - " + invoice.getInvoiceNo());
            ledger.add(entry);
        }

        // Get all payments for supplier
        List<BillPayment> payments = billPaymentRepository.findBySupplierId(supplierId);
        for (BillPayment payment : payments) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("date", payment.getPaymentDate());
            entry.put("type", "Payment");
            entry.put("invoiceNo", payment.getPurchaseInvoice().getInvoiceNo());
            entry.put("amount", BigDecimal.ZERO);
            entry.put("payment", payment.getAdjustAmount());
            entry.put("balance", payment.getBalanceAmount());
            entry.put("description", "Payment Made - " + payment.getPaymentNo());
            ledger.add(entry);
        }

        // Sort by date
        ledger.sort((a, b) -> ((LocalDate) a.get("date")).compareTo((LocalDate) b.get("date")));
        return ledger;
    }

    // ==================== CONVERSION METHODS ====================

    private BillReceiptResponse convertToResponse(BillReceipt receipt) {
        return BillReceiptResponse.builder()
            .id(receipt.getId())
            .receiptNo(receipt.getReceiptNo())
            .receiptDate(receipt.getReceiptDate())
            .customerName(receipt.getCustomer().getName())
            .invoiceNo(receipt.getSalesInvoice().getInvoiceNo())
            .totalAmount(receipt.getTotalAmount())
            .adjustAmount(receipt.getAdjustAmount())
            .balanceAmount(receipt.getBalanceAmount())
            .paymentMode(receipt.getPaymentMode() != null ? receipt.getPaymentMode().toString() : null)
            .referenceNo(receipt.getReferenceNo())
            .notes(receipt.getNotes())
            .createdAt(receipt.getCreatedAt())
            .build();
    }

    private BillPaymentResponse convertToResponse(BillPayment payment) {
        return BillPaymentResponse.builder()
            .id(payment.getId())
            .paymentNo(payment.getPaymentNo())
            .paymentDate(payment.getPaymentDate())
            .supplierName(payment.getSupplier().getName())
            .invoiceNo(payment.getPurchaseInvoice().getInvoiceNo())
            .totalAmount(payment.getTotalAmount())
            .adjustAmount(payment.getAdjustAmount())
            .balanceAmount(payment.getBalanceAmount())
            .paymentMode(payment.getPaymentMode() != null ? payment.getPaymentMode().toString() : null)
            .referenceNo(payment.getReferenceNo())
            .notes(payment.getNotes())
            .createdAt(payment.getCreatedAt())
            .build();
    }
}