package com.apnashop.repository;

import com.apnashop.entity.Borrowing;
import com.apnashop.entity.BorrowingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface BorrowingRepository extends JpaRepository<Borrowing, Integer> {

    List<Borrowing> findByMobileNo(String mobileNo);

    Optional<Borrowing> findFirstByCustomerIdAndNotesContaining(Integer customerId, String notesFragment);

    List<Borrowing> findByMobileNoAndDateBetweenAndStatus(
            String mobileNo, Instant start, Instant end, BorrowingStatus status);

    List<Borrowing> findByMobileNoAndStatusAndDueDateLessThanEqual(
            String mobileNo, BorrowingStatus status, Instant dueDate);
}
