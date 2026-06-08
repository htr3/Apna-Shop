package com.apnashop.dto;

import com.apnashop.entity.BorrowingStatus;
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
public class BorrowingWithCustomerDto {

    private Integer id;
    private String mobileNo;
    private Integer customerId;
    private BigDecimal amount;
    private Instant date;
    private Instant dueDate;
    private BorrowingStatus status;
    private String notes;
    private String customerName;
}
