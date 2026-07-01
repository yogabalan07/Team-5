package com.inventory.util;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
public class InvoiceGenerator {
    
    private static final String SALES_PREFIX = "INV-";
    private static final String PURCHASE_PREFIX = "PUR-";
    private static final String RETURN_PREFIX = "RET-";
    private static final String RECEIPT_PREFIX = "REC-";
    private static final String PAYMENT_PREFIX = "PAY-";
    private static final String PO_PREFIX = "PO-";
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");
    
    /**
     * Generate Sales Invoice Number
     * Format: INV-YYYYMMDD-XXXXXX
     * Example: INV-20260630-000001
     */
    public String generateSalesInvoiceNumber(int sequence) {
        String dateStr = LocalDate.now().format(DATE_FORMATTER);
        return SALES_PREFIX + dateStr + "-" + String.format("%06d", sequence);
    }
    
    /**
     * Generate Purchase Invoice Number
     * Format: PUR-YYYYMMDD-XXXXXX
     * Example: PUR-20260630-000001
     */
    public String generatePurchaseInvoiceNumber(int sequence) {
        String dateStr = LocalDate.now().format(DATE_FORMATTER);
        return PURCHASE_PREFIX + dateStr + "-" + String.format("%06d", sequence);
    }
    
    /**
     * Generate Purchase Order Number
     * Format: PO-YYYYMMDD-XXXXXX
     * Example: PO-20260630-000001
     */
    public String generatePONumber(int sequence) {
        String dateStr = LocalDate.now().format(DATE_FORMATTER);
        return PO_PREFIX + dateStr + "-" + String.format("%06d", sequence);
    }
    
    /**
     * Generate Return Number
     * Format: RET-YYYYMMDD-XXXXXX
     * Example: RET-20260630-000001
     */
    public String generateReturnNumber(int sequence) {
        String dateStr = LocalDate.now().format(DATE_FORMATTER);
        return RETURN_PREFIX + dateStr + "-" + String.format("%06d", sequence);
    }
    
    /**
     * Generate Receipt Number
     * Format: REC-YYYYMMDD-XXXXXX
     * Example: REC-20260630-000001
     */
    public String generateReceiptNumber(int sequence) {
        String dateStr = LocalDate.now().format(DATE_FORMATTER);
        return RECEIPT_PREFIX + dateStr + "-" + String.format("%06d", sequence);
    }
    
    /**
     * Generate Payment Number
     * Format: PAY-YYYYMMDD-XXXXXX
     * Example: PAY-20260630-000001
     */
    public String generatePaymentNumber(int sequence) {
        String dateStr = LocalDate.now().format(DATE_FORMATTER);
        return PAYMENT_PREFIX + dateStr + "-" + String.format("%06d", sequence);
    }
    
    /**
     * Generate Purchase Invoice Number (Simple format without date)
     * Format: PUR-XXXXXX
     * Example: PUR-000001
     */
    public String generatePurchaseInvoiceNumberSimple(int sequence) {
        return PURCHASE_PREFIX + String.format("%06d", sequence);
    }
    
    /**
     * Generate Purchase Order Number (Simple format without date)
     * Format: PO-XXXXXX
     * Example: PO-000001
     */
    public String generatePONumberSimple(int sequence) {
        return PO_PREFIX + String.format("%06d", sequence);
    }
    
    /**
     * Extract sequence number from invoice number
     * Extracts the last 6 digits
     */
    public int extractSequenceNumber(String invoiceNumber) {
        if (invoiceNumber == null || invoiceNumber.isEmpty()) {
            return 0;
        }
        // Extract last 6 digits
        int length = invoiceNumber.length();
        if (length < 6) {
            return 0;
        }
        String sequence = invoiceNumber.substring(length - 6);
        try {
            return Integer.parseInt(sequence);
        } catch (NumberFormatException e) {
            return 0;
        }
    }
    
    /**
     * Extract date from invoice number
     * Format: PREFIX-YYYYMMDD-XXXXXX
     */
    public String extractDate(String invoiceNumber) {
        if (invoiceNumber == null || invoiceNumber.isEmpty()) {
            return null;
        }
        String[] parts = invoiceNumber.split("-");
        if (parts.length >= 2) {
            return parts[1];
        }
        return null;
    }
    
    /**
     * Get today's date as string
     */
    public String getTodayDateStr() {
        return LocalDate.now().format(DATE_FORMATTER);
    }
    
    /**
     * Check if invoice number is for today
     */
    public boolean isTodayInvoice(String invoiceNumber) {
        if (invoiceNumber == null || invoiceNumber.isEmpty()) {
            return false;
        }
        String dateStr = extractDate(invoiceNumber);
        if (dateStr == null) {
            return false;
        }
        return dateStr.equals(getTodayDateStr());
    }
    
    /**
     * Get the next sequence number from a list of invoice numbers
     */
    public int getNextSequenceNumber(List<String> invoiceNumbers, String prefix) {
        int maxSeq = 0;
        for (String invoiceNo : invoiceNumbers) {
            if (invoiceNo != null && invoiceNo.startsWith(prefix)) {
                int seq = extractSequenceNumber(invoiceNo);
                if (seq > maxSeq) {
                    maxSeq = seq;
                }
            }
        }
        return maxSeq + 1;
    }
    
    /**
     * Get next sequence number for a specific date
     */
    public int getNextSequenceNumberForDate(List<String> invoiceNumbers, String prefix, String date) {
        int maxSeq = 0;
        String datePrefix = prefix + date + "-";
        for (String invoiceNo : invoiceNumbers) {
            if (invoiceNo != null && invoiceNo.startsWith(datePrefix)) {
                int seq = extractSequenceNumber(invoiceNo);
                if (seq > maxSeq) {
                    maxSeq = seq;
                }
            }
        }
        return maxSeq + 1;
    }
}