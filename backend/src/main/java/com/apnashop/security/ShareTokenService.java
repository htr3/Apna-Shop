package com.apnashop.security;

import com.apnashop.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

/**
 * Issues and verifies stateless, hard-to-guess share tokens for a customer's
 * public ledger. A token is {base64url(customerId)}.{base64url(HMAC-SHA256(customerId))}
 * signed with the app JWT secret, so no database column is required.
 */
@Service
public class ShareTokenService {

    private final byte[] secret;
    private static final Base64.Encoder ENC = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder DEC = Base64.getUrlDecoder();

    public ShareTokenService(@Value("${app.jwt.secret}") String secret) {
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
    }

    public String createToken(Integer customerId) {
        String payload = String.valueOf(customerId);
        String sig = sign(payload);
        return ENC.encodeToString(payload.getBytes(StandardCharsets.UTF_8)) + "." + sig;
    }

    /** Verifies the token and returns the customer id, or throws if invalid. */
    public Integer verifyToken(String token) {
        if (token == null || !token.contains(".")) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Invalid link");
        }
        String[] parts = token.split("\\.", 2);
        String payload;
        try {
            payload = new String(DEC.decode(parts[0]), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Invalid link");
        }
        String expected = sign(payload);
        if (!MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8),
                parts[1].getBytes(StandardCharsets.UTF_8))) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Invalid link");
        }
        try {
            return Integer.parseInt(payload);
        } catch (NumberFormatException ex) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Invalid link");
        }
    }

    private String sign(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            byte[] digest = mac.doFinal(("ledger:" + payload).getBytes(StandardCharsets.UTF_8));
            return ENC.encodeToString(digest);
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to sign share token", ex);
        }
    }
}
