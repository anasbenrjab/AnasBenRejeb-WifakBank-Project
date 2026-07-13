package tn.esprit.wifakbankproject.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import tn.esprit.wifakbankproject.dto.AppEntry;
import tn.esprit.wifakbankproject.service.DashboardService;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    /**
     * GET /api/dashboard/applications
     * Requires: Authorization: Bearer <token>
     * Returns the list of ACTIVE applications the authenticated user can access.
     */
    @GetMapping("/applications")
    public ResponseEntity<List<AppEntry>> getAuthorizedApplications(
            @AuthenticationPrincipal String login) {
        return ResponseEntity.ok(dashboardService.getAuthorizedApps(login));
    }
}
