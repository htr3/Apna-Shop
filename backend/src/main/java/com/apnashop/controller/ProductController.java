package com.apnashop.controller;

import com.apnashop.dto.MessageResponse;
import com.apnashop.entity.Product;
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
public class ProductController {

    private final ShopService shopService;

    @GetMapping("/api/products")
    public List<Product> list(HttpServletRequest request) {
        AuthUser user = AuthUtil.getAuthUser(request);
        return shopService.getProducts(user.mobileNo());
    }

    @PostMapping("/api/products")
    public ResponseEntity<Product> create(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        AuthUser user = AuthUtil.getAuthUser(request);
        Product product = shopService.createProduct(body, user.mobileNo(), user.userId());
        return ResponseEntity.status(HttpStatus.CREATED).body(product);
    }

    @PutMapping("/api/products/{id}")
    public Product update(@PathVariable Integer id, @RequestBody Map<String, Object> body, HttpServletRequest request) {
        AuthUtil.getAuthUser(request);
        Product product = shopService.updateProduct(id, body);
        if (product == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Product not found");
        }
        return product;
    }

    @DeleteMapping("/api/products/{id}")
    public MessageResponse delete(@PathVariable Integer id, HttpServletRequest request) {
        AuthUtil.getAuthUser(request);
        boolean success = shopService.deleteProduct(id);
        if (!success) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Product not found");
        }
        return new MessageResponse(null, true);
    }
}
