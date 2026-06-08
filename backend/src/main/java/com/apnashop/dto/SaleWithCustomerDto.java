package com.apnashop.dto;

import com.apnashop.entity.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaleWithCustomerDto {

    private Integer id;
    private String mobileNo;
    private Integer userId;
    private BigDecimal amount;
    private BigDecimal paidAmount;
    private BigDecimal pendingAmount;
    private Instant date;
    private PaymentMethod paymentMethod;
    private Integer customerId;
    private String customerName;
    private BigDecimal discount;
    private String discountType;
    private BigDecimal discountValue;
    private String items;
}
