package com.apnashop.security;

import com.apnashop.exception.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;

public final class AuthUtil {

    private AuthUtil() {
    }

    public static AuthUser getAuthUser(HttpServletRequest request) {
        Object value = request.getAttribute(JwtAuthFilter.AUTH_USER_ATTR);
        if (value instanceof AuthUser authUser) {
            return authUser;
        }
        throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication token required");
    }
}
