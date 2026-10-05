package tn.esprit.wifakbankproject.service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import tn.esprit.wifakbankproject.entity.Application;
import tn.esprit.wifakbankproject.event.ApplicationChangedEvent;
import tn.esprit.wifakbankproject.repository.ApplicationRepository;

import java.util.Collections;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * In-memory read-through cache of ACTIVE applications.
 *
 * Design decisions:
 *   - The cache is a single {@code volatile} reference to an immutable Map.
 *     Readers always see either the old map or the new map — never a partially
 *     populated one.  No locking is required on reads.
 *
 *   - The map is rebuilt (not mutated) on every refresh.  This is safe because
 *     Application objects returned by JPA are detached after the transaction
 *     closes, so callers cannot accidentally modify cached state.
 *
 *   - Two refresh triggers:
 *       1. {@code @PostConstruct} — warm the cache at startup before the first
 *          request arrives.
 *       2. {@code @Scheduled(fixedDelay=60_000)} — periodic refresh to pick up
 *          changes made directly in the DB (bypassing the event system).
 *       3. {@code @EventListener(ApplicationChangedEvent.class)} — immediate
 *          invalidation when AdminService mutates an application through the API.
 *
 * Phase 1 contract: read-only.  AdminService does not yet publish
 * ApplicationChangedEvent; that wiring happens in Phase 2.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ApplicationRegistry {

    private final ApplicationRepository applicationRepository;

    /**
     * The live cache.  Declared volatile so that the reference swap performed
     * by {@link #refresh()} is immediately visible to all threads without
     * requiring synchronization on the read path.
     */
    private volatile Map<Long, Application> activeApplications = Collections.emptyMap();

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    /**
     * Populate the cache before the application starts serving requests.
     */
    @PostConstruct
    public void init() {
        refresh();
    }

    // ── Refresh triggers ──────────────────────────────────────────────────────

    /**
     * Periodic refresh — runs every 60 s after the previous execution completes.
     * Public so that it can be called from tests without needing Spring's
     * task scheduler to be running.
     *
     * Only caches ACTIVE, non-deleted applications.
     * Soft-deleted apps (deleted = true) are excluded at the query level,
     * so they are evicted from the cache immediately when the event-driven
     * refresh fires after a soft-delete.
     */
    @Scheduled(fixedDelay = 60_000)
    public void refresh() {
        Map<Long, Application> snapshot = applicationRepository
                .findByStatusAndDeletedFalse(Application.Status.ACTIVE)
                .stream()
                .collect(Collectors.toUnmodifiableMap(
                        Application::getId,
                        Function.identity()
                ));

        activeApplications = snapshot;          // atomic reference swap
        log.debug("ApplicationRegistry refreshed: {} active application(s) cached.",
                snapshot.size());
    }

    /**
     * Event-driven refresh — fires immediately when an application is created,
     * updated, or deleted via the admin API.
     *
     * Phase 1: AdminService does not yet publish this event, so this listener
     * is wired but never triggered.  No behaviour change in Phase 1.
     */
    @EventListener
    public void onApplicationChanged(ApplicationChangedEvent event) {
        log.debug("ApplicationChangedEvent received from '{}' — refreshing registry.",
                event.getSource().getClass().getSimpleName());
        refresh();
    }

    // ── Read API ──────────────────────────────────────────────────────────────

    /**
     * Returns the current immutable snapshot of active applications keyed by ID.
     *
     * Callers must not modify the returned map.  The reference may be replaced
     * at any time by a background refresh; callers should not cache it locally.
     *
     * @return unmodifiable map of active {@link Application} entities, keyed by
     *         {@code Application.id}.
     */
    public Map<Long, Application> getActiveApplications() {
        return activeApplications;
    }
}
