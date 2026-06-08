package com.apnashop.controller;

import com.apnashop.dto.BorrowingWithCustomerDto;
import com.apnashop.entity.Borrowing;
import com.apnashop.exception.ApiException;
import com.apnashop.security.AuthUser;
import com.apnashop.security.AuthUtil;
import com.apnashop.service.ShopService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class BorrowingController {

    private final ShopService shopService;

    @GetMapping("/api/borrowings")
    public List<BorrowingWithCustomerDto> list(HttpServletRequest request) {
        AuthUser user = AuthUtil.getAuthUser(request);
        return shopService.getBorrowings(user.mobileNo());
    }

    @PostMapping("/api/borrowings")
    public ResponseEntity<Borrowing> create(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        AuthUser user = AuthUtil.getAuthUser(request);
        Borrowing borrowing = shopService.createBorrowing(body, user.mobileNo());
        return ResponseEntity.status(HttpStatus.CREATED).body(borrowing);
    }

    @PostMapping("/api/borrowings/payment")
    public ResponseEntity<Borrowing> recordPayment(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        AuthUser user = AuthUtil.getAuthUser(request);
        Borrowing borrowing = shopService.recordRepayment(body, user.mobileNo());
        return ResponseEntity.status(HttpStatus.CREATED).body(borrowing);
    }

    @PatchMapping("/api/borrowings/{id}")
    public Borrowing updateStatus(@PathVariable Integer id, @RequestBody Map<String, Object> body,
                                  HttpServletRequest request) {
        AuthUtil.getAuthUser(request);
        Object status = body.get("status");
        if (status == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "status is required");
        }
        return shopService.updateBorrowingStatus(id, String.valueOf(status));
    }

    @PutMapping("/api/borrowings/{id}/amount")
    public Borrowing updateAmount(@PathVariable Integer id, @RequestBody Map<String, Object> body,
                                  HttpServletRequest request) {
        AuthUser user = AuthUtil.getAuthUser(request);
        Object amount = body.get("amount");
        if (amount == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "amount is required");
        }
        Borrowing borrowing = shopService.updateBorrowingAmount(id, String.valueOf(amount), user.mobileNo());
        if (borrowing == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Borrowing not found or access denied");
        }
        return borrowing;
    }
}
