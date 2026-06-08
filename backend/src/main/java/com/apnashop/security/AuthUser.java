package com.apnashop.security;

public record AuthUser(
        Integer userId,
        String username,
        String mobileNo,
        String role
) {
}
