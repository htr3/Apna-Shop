package com.apnashop.controller;

import com.apnashop.entity.Customer;
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
public class CustomerController {

    private final ShopService shopService;

    @GetMapping("/api/customers")
    public List<Customer> list(HttpServletRequest request) {
        AuthUser user = AuthUtil.getAuthUser(request);
        return shopService.getCustomers(user.mobileNo());
    }

    @PostMapping("/api/customers")
    public ResponseEntity<Customer> create(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        AuthUser user = AuthUtil.getAuthUser(request);
        Customer customer = shopService.createCustomer(body, user.mobileNo(), user.userId());
        return ResponseEntity.status(HttpStatus.CREATED).body(customer);
    }

    @GetMapping("/api/customers/{id}")
    public Customer get(@PathVariable Integer id) {
        return shopService.getCustomer(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Customer not found"));
    }
}
