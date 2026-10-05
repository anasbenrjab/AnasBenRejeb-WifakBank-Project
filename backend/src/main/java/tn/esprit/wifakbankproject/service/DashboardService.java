package tn.esprit.wifakbankproject.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.wifakbankproject.dto.AppEntry;
import tn.esprit.wifakbankproject.entity.Application;
import tn.esprit.wifakbankproject.entity.User;
import tn.esprit.wifakbankproject.exception.ResourceNotFoundException;
import tn.esprit.wifakbankproject.repository.UserApplicationRoleRepository;
import tn.esprit.wifakbankproject.repository.UserRepository;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository                userRepository;
    private final UserApplicationRoleRepository userApplicationRoleRepository;
    private final ApplicationRegistry          applicationRegistry;

    /**
     * Returns the list of ACTIVE applications the authenticated user can access.
     *
     * Phase 1 change: the ACTIVE-application filter now consults
     * {@link ApplicationRegistry} (in-memory cache) instead of issuing a
     * per-request {@code findByStatus(ACTIVE)} query against the DB.
     *
     * The USER_APPLICATION_ROLES query and the AppEntry mapping are unchanged.
     * The JSON response shape is identical to before Phase 1.
     */
    @Transactional(readOnly = true)
    public List<AppEntry> getAuthorizedApps(String login) {
        User user = userRepository.findByLogin(login)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable: " + login));

        // Snapshot the cache once — same reference for the entire call.
        Map<Long, Application> activeApps = applicationRegistry.getActiveApplications();

        // Collect app IDs the user holds at least one role on,
        // then filter to only those present in the active-apps cache.
        // Deduplication is implicit: Map.get() on a set of distinct IDs.
        return userApplicationRoleRepository.findByUserId(user.getId()).stream()
                .map(uar -> uar.getApplication().getId())           // Long ids only
                .distinct()                                         // deduplicate multi-role
                .map(activeApps::get)                               // null if not ACTIVE
                .filter(app -> app != null)                         // drop inactive / unknown
                .map(app -> AppEntry.builder()
                        .id(app.getId())
                        .code(app.getCode())
                        .nom(app.getNom())
                        .description(app.getDescription())
                        .url(app.getUrl())
                        .icon(app.getIcon())
                        // Phase 2: new fields — null-safe defaults mirror entity @Builder.Default
                        .launchMode(app.getLaunchMode() != null
                                ? app.getLaunchMode().name()
                                : "IFRAME")
                        .category(app.getCategory())
                        .displayOrder(app.getDisplayOrder() != null
                                ? app.getDisplayOrder()
                                : 0)
                        .iconType(app.getIconType() != null
                                ? app.getIconType().name()
                                : "BOOTSTRAP_ICON")
                        .build())
                .toList();
    }
}
