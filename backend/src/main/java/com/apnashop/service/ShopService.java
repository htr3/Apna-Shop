package com.apnashop.service;

import com.apnashop.dto.BorrowingWithCustomerDto;
import com.apnashop.dto.DashboardStatsDto;
import com.apnashop.dto.SaleWithCustomerDto;
import com.apnashop.entity.*;
import com.apnashop.exception.ApiException;
import com.apnashop.repository.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ShopService {

    private final CustomerRepository customerRepository;
    private final BorrowingRepository borrowingRepository;
    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final ObjectMapper objectMapper;

    public List<Customer> getCustomers(String mobileNo) {
        return customerRepository.findByMobileNo(mobileNo);
    }

    public Optional<Customer> getCustomer(Integer id) {
        return customerRepository.findById(id);
    }

    @Transactional
    public Customer createCustomer(Map<String, Object> body, String mobileNo, Integer userId) {
        String phone = stringValue(body.get("phone"));
        if (phone == null || phone.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "phone is required");
        }

        customerRepository.findByMobileNoAndPhone(mobileNo, phone).ifPresent(existing -> {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This phone number is already registered");
        });

        Customer customer = Customer.builder()
                .mobileNo(mobileNo)
                .userId(userId != null ? userId : 1)
                .name(stringValue(body.get("name")))
                .phone(phone)
                .trustScore(intValue(body.get("trustScore"), 100))
                .totalPurchase(decimalValue(body.get("totalPurchase"), BigDecimal.ZERO))
                .borrowedAmount(decimalValue(body.get("borrowedAmount"), BigDecimal.ZERO))
                .isRisky(boolValue(body.get("isRisky"), false))
                .build();

        try {
            return customerRepository.save(customer);
        } catch (DataIntegrityViolationException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This phone number is already registered");
        }
    }

    public List<BorrowingWithCustomerDto> getBorrowings(String mobileNo) {
        List<Borrowing> borrowings = borrowingRepository.findByMobileNo(mobileNo);
        Map<Integer, String> customerNames = new HashMap<>();

        return borrowings.stream()
                .map(b -> {
                    String name = customerNames.computeIfAbsent(b.getCustomerId(), cid ->
                            customerRepository.findById(cid)
                                    .map(Customer::getName)
                                    .orElse("Unknown"));
                    return toBorrowingDto(b, name);
                })
                .toList();
    }

    @Transactional
    public Borrowing createBorrowing(Map<String, Object> body, String mobileNo) {
        Integer customerId = intValue(body.get("customerId"), null);
        if (customerId == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "customerId is required");
        }

        Borrowing borrowing = Borrowing.builder()
                .mobileNo(mobileNo)
                .customerId(customerId)
                .amount(decimalValue(body.get("amount"), BigDecimal.ZERO))
                .date(parseInstant(body.get("date"), Instant.now()))
                .dueDate(parseInstant(body.get("dueDate"), null))
                .status(parseBorrowingStatus(body.get("status")))
                .notes(stringValue(body.get("notes")))
                .build();

        try {
            Borrowing saved = borrowingRepository.save(borrowing);
            log.info("Created borrowing id={} amount={} customerId={} (mobile {})",
                    saved.getId(), saved.getAmount(), customerId, mobileNo);
            return saved;
        } catch (DataIntegrityViolationException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Customer not found");
        }
    }

    @Transactional
    public Borrowing updateBorrowingStatus(Integer id, String status) {
        Borrowing borrowing = borrowingRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Borrowing not found"));

        borrowing.setStatus(BorrowingStatus.valueOf(status));
        return borrowingRepository.save(borrowing);
    }

    @Transactional
    public Borrowing updateBorrowingAmount(Integer id, String amountStr, String mobileNo) {
        Borrowing existing = borrowingRepository.findById(id).orElse(null);
        if (existing == null) {
            return null;
        }
        if (mobileNo != null && !mobileNo.equals(existing.getMobileNo())) {
            return null;
        }

        BigDecimal oldAmount = existing.getAmount();
        BigDecimal newAmount = new BigDecimal(amountStr);
        BigDecimal difference = newAmount.subtract(oldAmount);

        existing.setAmount(newAmount);
        Borrowing saved = borrowingRepository.save(existing);

        if (existing.getCustomerId() != null) {
            customerRepository.findById(existing.getCustomerId()).ifPresent(customer -> {
                BigDecimal currentBorrowed = customer.getBorrowedAmount() != null
                        ? customer.getBorrowedAmount()
                        : BigDecimal.ZERO;
                BigDecimal updatedBorrowed = currentBorrowed.add(difference).max(BigDecimal.ZERO);
                customer.setBorrowedAmount(updatedBorrowed);
                customerRepository.save(customer);
            });
        }

        return saved;
    }

    @Transactional
    public Borrowing recordRepayment(Map<String, Object> body, String mobileNo) {
        Integer customerId = intValue(body.get("customerId"), null);
        if (customerId == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "customerId is required");
        }
        BigDecimal amount = decimalValue(body.get("amount"), BigDecimal.ZERO);
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "amount must be greater than 0");
        }

        String notes = stringValue(body.get("notes"));
        if (notes == null || notes.isBlank()) {
            notes = "Payment received";
        }

        Borrowing payment = Borrowing.builder()
                .mobileNo(mobileNo)
                .customerId(customerId)
                .amount(amount.negate())
                .date(parseInstant(body.get("date"), Instant.now()))
                .status(BorrowingStatus.PAID)
                .notes(notes)
                .build();

        Borrowing saved;
        try {
            saved = borrowingRepository.save(payment);
        } catch (DataIntegrityViolationException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Customer not found");
        }

        final BigDecimal paid = amount;
        customerRepository.findById(customerId).ifPresent(customer -> {
            BigDecimal current = customer.getBorrowedAmount() != null
                    ? customer.getBorrowedAmount()
                    : BigDecimal.ZERO;
            customer.setBorrowedAmount(current.subtract(paid).max(BigDecimal.ZERO));
            customerRepository.save(customer);
        });

        log.info("Recorded repayment of {} for customerId={} (mobile {})", amount, customerId, mobileNo);
        return saved;
    }

    public List<SaleWithCustomerDto> getSales(String mobileNo) {
        return saleRepository.findByMobileNo(mobileNo).stream()
                .map(this::toSaleDto)
                .sorted(Comparator.comparing(SaleWithCustomerDto::getDate,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Transactional
    public Sale createSale(Map<String, Object> body, String mobileNo, Integer userId) {
        Sale sale = Sale.builder()
                .mobileNo(mobileNo)
                .userId(userId != null ? userId : 1)
                .amount(decimalValue(body.get("amount"), BigDecimal.ZERO))
                .paidAmount(decimalValue(body.get("paidAmount"), BigDecimal.ZERO))
                .pendingAmount(decimalValue(body.get("pendingAmount"), BigDecimal.ZERO))
                .date(parseInstant(body.get("date"), Instant.now()))
                .paymentMethod(parsePaymentMethod(body.get("paymentMethod")))
                .customerId(intValue(body.get("customerId"), null))
                .discount(decimalValue(body.get("discount"), BigDecimal.ZERO))
                .discountType(body.get("discountType") != null ? String.valueOf(body.get("discountType")) : "RUPEES")
                .discountValue(decimalValue(body.get("discountValue"), BigDecimal.ZERO))
                .items(itemsToString(body.get("items")))
                .build();

        try {
            sale = saleRepository.save(sale);
        } catch (DataIntegrityViolationException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Customer not found");
        }

        deductStockFromItems(body.get("items"), mobileNo);

        if (sale.getCustomerId() != null) {
            updateCustomerOnSaleCreate(sale, mobileNo);
        }

        log.info("Created sale id={} amount={} paid={} pending={} customerId={} (mobile {})",
                sale.getId(), sale.getAmount(), sale.getPaidAmount(), sale.getPendingAmount(),
                sale.getCustomerId(), mobileNo);
        return sale;
    }

    @Transactional
    public Sale updateSale(Integer id, Map<String, Object> updates, String mobileNo) {
        Sale existing = saleRepository.findById(id).orElse(null);
        if (existing == null) {
            return null;
        }
        if (mobileNo != null && !mobileNo.equals(existing.getMobileNo())) {
            return null;
        }

        BigDecimal oldPending = existing.getPendingAmount() != null
                ? existing.getPendingAmount()
                : BigDecimal.ZERO;

        applySaleUpdates(existing, updates);
        Sale updated = saleRepository.save(existing);

        syncPendingBorrowing(existing, updated, oldPending, updates, mobileNo);
        return updated;
    }

    @Transactional
    public boolean deleteSale(Integer id, String mobileNo) {
        Optional<Sale> saleOpt = saleRepository.findById(id);
        if (saleOpt.isEmpty()) {
            return false;
        }
        Sale sale = saleOpt.get();
        if (mobileNo != null && !mobileNo.equals(sale.getMobileNo())) {
            return false;
        }
        saleRepository.delete(sale);
        return true;
    }

    public List<Product> getProducts(String mobileNo) {
        return productRepository.findByMobileNoAndIsActiveTrue(mobileNo);
    }

    @Transactional
    public Product createProduct(Map<String, Object> body, String mobileNo, Integer userId) {
        Product product = Product.builder()
                .mobileNo(mobileNo)
                .userId(userId != null ? userId : 1)
                .name(stringValue(body.get("name")))
                .price(decimalValue(body.get("price"), BigDecimal.ZERO))
                .quantity(intValue(body.get("quantity"), 0))
                .unit(stringValue(body.get("unit")))
                .category(stringValue(body.get("category")))
                .description(stringValue(body.get("description")))
                .isActive(boolValue(body.get("isActive"), true))
                .build();

        return productRepository.save(product);
    }

    @Transactional
    public Product updateProduct(Integer id, Map<String, Object> body) {
        Product existing = productRepository.findById(id).orElse(null);
        if (existing == null) {
            return null;
        }

        if (body.containsKey("name") && body.get("name") != null) {
            existing.setName(stringValue(body.get("name")));
        }
        if (body.containsKey("price") && body.get("price") != null) {
            existing.setPrice(decimalValue(body.get("price"), existing.getPrice()));
        }
        if (body.containsKey("quantity") && body.get("quantity") != null) {
            existing.setQuantity(intValue(body.get("quantity"), existing.getQuantity()));
        }
        if (body.containsKey("unit")) {
            existing.setUnit(stringValue(body.get("unit")));
        }
        if (body.containsKey("category")) {
            existing.setCategory(stringValue(body.get("category")));
        }
        if (body.containsKey("description")) {
            existing.setDescription(stringValue(body.get("description")));
        }
        if (body.containsKey("isActive") && body.get("isActive") != null) {
            existing.setIsActive(boolValue(body.get("isActive"), existing.getIsActive()));
        }

        return productRepository.save(existing);
    }

    @Transactional
    public boolean deleteProduct(Integer id) {
        if (!productRepository.existsById(id)) {
            return false;
        }
        productRepository.deleteById(id);
        return true;
    }

    public DashboardStatsDto getDashboardStats(String mobileNo) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        Instant startOfDay = today.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant startOfMonth = today.withDayOfMonth(1).atStartOfDay(ZoneOffset.UTC).toInstant();

        List<Sale> sales = saleRepository.findByMobileNo(mobileNo);
        List<Borrowing> borrowings = borrowingRepository.findByMobileNo(mobileNo);
        List<Customer> customers = customerRepository.findByMobileNo(mobileNo);

        double todaySales = sales.stream()
                .filter(s -> s.getDate() != null && !s.getDate().isBefore(startOfDay))
                .mapToDouble(s -> s.getAmount().doubleValue())
                .sum();

        double monthSales = sales.stream()
                .filter(s -> s.getDate() != null && !s.getDate().isBefore(startOfMonth))
                .mapToDouble(s -> s.getAmount().doubleValue())
                .sum();

        double borrowingsPending = borrowings.stream()
                .filter(b -> b.getStatus() == BorrowingStatus.PENDING || b.getStatus() == BorrowingStatus.OVERDUE)
                .mapToDouble(b -> b.getAmount().doubleValue())
                .sum();

        double salesPendingTotal = sales.stream()
                .mapToDouble(s -> {
                    BigDecimal pending = s.getPendingAmount();
                    return pending != null ? pending.doubleValue() : 0;
                })
                .sum();

        long trustableCount = customers.stream()
                .filter(c -> (c.getTrustScore() != null ? c.getTrustScore() : 0) >= 70)
                .count();

        long riskyCount = customers.stream()
                .filter(c -> (c.getTrustScore() != null ? c.getTrustScore() : 0) < 40)
                .count();

        return DashboardStatsDto.builder()
                .todaySales(todaySales)
                .monthSales(monthSales)
                .pendingUdhaar(borrowingsPending + salesPendingTotal)
                .trustableCount(trustableCount)
                .riskyCount(riskyCount)
                .build();
    }

    private void updateCustomerOnSaleCreate(Sale sale, String mobileNo) {
        customerRepository.findById(sale.getCustomerId()).ifPresent(customer -> {
            BigDecimal currentPurchase = customer.getTotalPurchase() != null
                    ? customer.getTotalPurchase()
                    : BigDecimal.ZERO;
            customer.setTotalPurchase(currentPurchase.add(sale.getAmount()));

            BigDecimal pendingAmount = sale.getPendingAmount() != null
                    ? sale.getPendingAmount()
                    : BigDecimal.ZERO;
            if (pendingAmount.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal currentBorrowed = customer.getBorrowedAmount() != null
                        ? customer.getBorrowedAmount()
                        : BigDecimal.ZERO;
                customer.setBorrowedAmount(currentBorrowed.add(pendingAmount));

                Borrowing borrowing = Borrowing.builder()
                        .mobileNo(mobileNo)
                        .customerId(sale.getCustomerId())
                        .amount(pendingAmount)
                        .date(sale.getDate())
                        .status(BorrowingStatus.PENDING)
                        .notes("Auto-created from Sale #" + sale.getId())
                        .build();
                borrowingRepository.save(borrowing);
            }

            customerRepository.save(customer);
        });
    }

    private void syncPendingBorrowing(
            Sale existingSale,
            Sale updatedSale,
            BigDecimal oldPending,
            Map<String, Object> updates,
            String mobileNo
    ) {
        if (existingSale.getCustomerId() == null) {
            return;
        }

        BigDecimal newPending = updates.containsKey("pendingAmount")
                ? decimalValue(updates.get("pendingAmount"), oldPending)
                : oldPending;

        int comparison = newPending.compareTo(oldPending);
        if (comparison == 0) {
            return;
        }

        Integer customerId = existingSale.getCustomerId();
        String saleNote = "Sale #" + existingSale.getId();

        if (comparison > 0) {
            BigDecimal difference = newPending.subtract(oldPending);
            Optional<Borrowing> existingBorrowing = borrowingRepository
                    .findFirstByCustomerIdAndNotesContaining(customerId, saleNote);

            if (existingBorrowing.isPresent()) {
                existingBorrowing.get().setAmount(newPending);
                borrowingRepository.save(existingBorrowing.get());
            } else {
                Borrowing borrowing = Borrowing.builder()
                        .mobileNo(mobileNo != null ? mobileNo : existingSale.getMobileNo())
                        .customerId(customerId)
                        .amount(difference)
                        .date(existingSale.getDate())
                        .status(BorrowingStatus.PENDING)
                        .notes("Auto-created from Sale #" + existingSale.getId() + " (Updated)")
                        .build();
                borrowingRepository.save(borrowing);
            }

            adjustCustomerBorrowedAmount(customerId, difference);
        } else {
            BigDecimal difference = oldPending.subtract(newPending);
            borrowingRepository.findFirstByCustomerIdAndNotesContaining(customerId, saleNote)
                    .ifPresent(borrowing -> {
                        if (newPending.compareTo(BigDecimal.ZERO) == 0) {
                            borrowingRepository.delete(borrowing);
                        } else {
                            borrowing.setAmount(newPending);
                            borrowingRepository.save(borrowing);
                        }
                    });
            adjustCustomerBorrowedAmount(customerId, difference.negate());
        }
    }

    private void adjustCustomerBorrowedAmount(Integer customerId, BigDecimal delta) {
        customerRepository.findById(customerId).ifPresent(customer -> {
            BigDecimal current = customer.getBorrowedAmount() != null
                    ? customer.getBorrowedAmount()
                    : BigDecimal.ZERO;
            customer.setBorrowedAmount(current.add(delta).max(BigDecimal.ZERO));
            customerRepository.save(customer);
        });
    }

    private void deductStockFromItems(Object itemsObj, String mobileNo) {
        JsonNode itemsNode = toItemsNode(itemsObj);
        if (itemsNode == null || !itemsNode.isArray()) {
            return;
        }

        for (JsonNode item : itemsNode) {
            if (!item.has("productId") || !item.has("quantity")) {
                continue;
            }
            int productId = item.get("productId").asInt();
            int quantity = item.get("quantity").asInt();
            if (quantity <= 0) {
                continue;
            }

            productRepository.findByIdAndMobileNo(productId, mobileNo).ifPresent(product -> {
                int currentQuantity = product.getQuantity() != null ? product.getQuantity() : 0;
                product.setQuantity(Math.max(0, currentQuantity - quantity));
                productRepository.save(product);
            });
        }
    }

    private void applySaleUpdates(Sale sale, Map<String, Object> updates) {
        if (updates.containsKey("amount") && updates.get("amount") != null) {
            sale.setAmount(decimalValue(updates.get("amount"), sale.getAmount()));
        }
        if (updates.containsKey("paidAmount") && updates.get("paidAmount") != null) {
            sale.setPaidAmount(decimalValue(updates.get("paidAmount"), sale.getPaidAmount()));
        }
        if (updates.containsKey("pendingAmount") && updates.get("pendingAmount") != null) {
            sale.setPendingAmount(decimalValue(updates.get("pendingAmount"), sale.getPendingAmount()));
        }
        if (updates.containsKey("date") && updates.get("date") != null) {
            sale.setDate(parseInstant(updates.get("date"), sale.getDate()));
        }
        if (updates.containsKey("paymentMethod") && updates.get("paymentMethod") != null) {
            sale.setPaymentMethod(parsePaymentMethod(updates.get("paymentMethod")));
        }
        if (updates.containsKey("customerId")) {
            sale.setCustomerId(intValue(updates.get("customerId"), sale.getCustomerId()));
        }
    }

    private BorrowingWithCustomerDto toBorrowingDto(Borrowing b, String customerName) {
        return BorrowingWithCustomerDto.builder()
                .id(b.getId())
                .mobileNo(b.getMobileNo())
                .customerId(b.getCustomerId())
                .amount(b.getAmount())
                .date(b.getDate())
                .dueDate(b.getDueDate())
                .status(b.getStatus())
                .notes(b.getNotes())
                .customerName(customerName)
                .build();
    }

    private SaleWithCustomerDto toSaleDto(Sale sale) {
        String customerName = "Walk-in";
        if (sale.getCustomerId() != null) {
            customerName = customerRepository.findById(sale.getCustomerId())
                    .map(Customer::getName)
                    .orElse("Unknown Customer");
        }

        return SaleWithCustomerDto.builder()
                .id(sale.getId())
                .mobileNo(sale.getMobileNo())
                .userId(sale.getUserId())
                .amount(sale.getAmount())
                .paidAmount(sale.getPaidAmount())
                .pendingAmount(sale.getPendingAmount())
                .date(sale.getDate())
                .paymentMethod(sale.getPaymentMethod())
                .customerId(sale.getCustomerId())
                .customerName(customerName)
                .discount(sale.getDiscount())
                .discountType(sale.getDiscountType())
                .discountValue(sale.getDiscountValue())
                .items(sale.getItems())
                .build();
    }

    private String itemsToString(Object itemsObj) {
        if (itemsObj == null) {
            return null;
        }
        if (itemsObj instanceof String str) {
            return str.isBlank() ? null : str;
        }
        try {
            return objectMapper.writeValueAsString(itemsObj);
        } catch (Exception ex) {
            return null;
        }
    }

    private JsonNode toItemsNode(Object itemsObj) {
        if (itemsObj == null) {
            return null;
        }
        if (itemsObj instanceof JsonNode node) {
            return node;
        }
        if (itemsObj instanceof String str) {
            try {
                return objectMapper.readTree(str);
            } catch (Exception ex) {
                return null;
            }
        }
        return objectMapper.valueToTree(itemsObj);
    }

    private BorrowingStatus parseBorrowingStatus(Object value) {
        if (value == null) {
            return BorrowingStatus.PENDING;
        }
        return BorrowingStatus.valueOf(String.valueOf(value));
    }

    private PaymentMethod parsePaymentMethod(Object value) {
        if (value == null) {
            return PaymentMethod.CASH;
        }
        return PaymentMethod.valueOf(String.valueOf(value));
    }

    private Instant parseInstant(Object value, Instant defaultValue) {
        if (value == null) {
            return defaultValue;
        }
        if (value instanceof Instant instant) {
            return instant;
        }
        try {
            return Instant.parse(String.valueOf(value));
        } catch (Exception ex) {
            return defaultValue;
        }
    }

    private String stringValue(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private Integer intValue(Object value, Integer defaultValue) {
        if (value == null) {
            return defaultValue;
        }
        if (value instanceof Number number) {
            return number.intValue();
        }
        return Integer.parseInt(String.valueOf(value));
    }

    private boolean boolValue(Object value, boolean defaultValue) {
        if (value == null) {
            return defaultValue;
        }
        if (value instanceof Boolean bool) {
            return bool;
        }
        return Boolean.parseBoolean(String.valueOf(value));
    }

    private BigDecimal decimalValue(Object value, BigDecimal defaultValue) {
        if (value == null) {
            return defaultValue;
        }
        if (value instanceof BigDecimal decimal) {
            return decimal;
        }
        if (value instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue());
        }
        return new BigDecimal(String.valueOf(value));
    }
}
