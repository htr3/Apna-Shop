package com.apnashop.controller;

import com.apnashop.dto.MessageResponse;
import com.apnashop.dto.SaleWithCustomerDto;
import com.apnashop.entity.Sale;
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
public class SaleController {

    private final ShopService shopService;

    @GetMapping("/api/sales")
    public List<SaleWithCustomerDto> list(HttpServletRequest request) {
        AuthUser user = AuthUtil.getAuthUser(request);
        return shopService.getSales(user.mobileNo());
    }

    @PostMapping("/api/sales")
    public ResponseEntity<Sale> create(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        AuthUser user = AuthUtil.getAuthUser(request);
        Sale sale = shopService.createSale(body, user.mobileNo(), user.userId());
        return ResponseEntity.status(HttpStatus.CREATED).body(sale);
    }

    @PutMapping("/api/sales/{id}")
    public Sale update(@PathVariable Integer id, @RequestBody Map<String, Object> body, HttpServletRequest request) {
        AuthUser user = AuthUtil.getAuthUser(request);
        Sale sale = shopService.updateSale(id, body, user.mobileNo());
        if (sale == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Sale not found or access denied");
        }
        return sale;
    }

    @DeleteMapping("/api/sales/{id}")
    public MessageResponse delete(@PathVariable Integer id, HttpServletRequest request) {
        AuthUser user = AuthUtil.getAuthUser(request);
        boolean success = shopService.deleteSale(id, user.mobileNo());
        if (!success) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Sale not found or access denied");
        }
        return new MessageResponse(null, true);
    }
}
