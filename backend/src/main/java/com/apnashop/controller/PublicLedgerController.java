package com.apnashop.controller;

import com.apnashop.dto.PublicLedgerDto;
import com.apnashop.service.PublicLedgerService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class PublicLedgerController {

    private final PublicLedgerService publicLedgerService;

    @GetMapping("/api/public/ledger/{token}")
    public PublicLedgerDto getLedger(@PathVariable String token) {
        return publicLedgerService.getLedger(token);
    }
}
