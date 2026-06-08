package com.apnashop.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "sales")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "mobile_no", nullable = false)
    private String mobileNo;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(name = "paid_amount")
    @Builder.Default
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(name = "pending_amount")
    @Builder.Default
    private BigDecimal pendingAmount = BigDecimal.ZERO;

    private Instant date;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method")
    @Builder.Default
    private PaymentMethod paymentMethod = PaymentMethod.CASH;

    @Column(name = "customer_id")
    private Integer customerId;

    @Column(name = "discount")
    @Builder.Default
    private BigDecimal discount = BigDecimal.ZERO;

    @Column(name = "discount_type")
    @Builder.Default
    private String discountType = "RUPEES";

    @Column(name = "discount_value")
    @Builder.Default
    private BigDecimal discountValue = BigDecimal.ZERO;

    @Column(name = "items", columnDefinition = "text")
    private String items;
}
