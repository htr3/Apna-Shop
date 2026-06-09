package com.apnashop.service;

import com.apnashop.dto.PublicLedgerDto;
import com.apnashop.entity.Borrowing;
import com.apnashop.entity.Customer;
import com.apnashop.entity.PaymentSettings;
import com.apnashop.exception.ApiException;
import com.apnashop.repository.BorrowingRepository;
import com.apnashop.repository.CustomerRepository;
import com.apnashop.security.ShareTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PublicLedgerService {

    private final ShareTokenService shareTokenService;
    private final CustomerRepository customerRepository;
    private final BorrowingRepository borrowingRepository;
    private final PaymentSettingsService paymentSettingsService;

    public PublicLedgerDto getLedger(String token) {
        Integer customerId = shareTokenService.verifyToken(token);
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ledger not found"));

        List<PublicLedgerDto.Entry> entries = borrowingRepository.findByCustomerId(customerId).stream()
                .sorted(Comparator.comparing(Borrowing::getDate, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(b -> PublicLedgerDto.Entry.builder()
                        .date(b.getDate())
                        .amount(b.getAmount())
                        .notes(b.getNotes())
                        .dueDate(b.getDueDate())
                        .status(b.getStatus() == null ? null : b.getStatus().name())
                        .build())
                .toList();

        BigDecimal outstanding = entries.stream()
                .map(PublicLedgerDto.Entry::getAmount)
                .filter(a -> a != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .max(BigDecimal.ZERO);

        PaymentSettings settings = paymentSettingsService.getSettings(customer.getMobileNo());
        String shopName = settings.getOwnerUpiName() != null && !settings.getOwnerUpiName().isBlank()
                ? settings.getOwnerUpiName()
                : "Apna Shop";

        log.info("Public ledger viewed for customerId={}", customerId);

        return PublicLedgerDto.builder()
                .customerName(customer.getName())
                .shopName(shopName)
                .outstanding(outstanding)
                .payment(PublicLedgerDto.Payment.builder()
                        .enableUpi(settings.getEnableUpi())
                        .ownerUpiId(settings.getOwnerUpiId())
                        .ownerUpiName(settings.getOwnerUpiName())
                        .build())
                .entries(entries)
                .build();
    }
}
