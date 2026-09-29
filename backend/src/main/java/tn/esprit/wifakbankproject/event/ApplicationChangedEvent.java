package tn.esprit.wifakbankproject.event;

import org.springframework.context.ApplicationEvent;

/**
 * Published whenever the APPLICATIONS table is mutated (create / update / delete).
 *
 * Phase 1: declared but not yet consumed by any listener.
 *           ApplicationRegistry listens to it in Phase 1 to invalidate its cache.
 *
 * Phase 2: additional listeners (audit, notification, …) can be added without
 *           touching the publisher sites.
 *
 * Intentionally carries no payload — listeners that need full application data
 * should re-query the registry or repository.  This avoids binding event
 * consumers to a stale entity snapshot.
 */
public class ApplicationChangedEvent extends ApplicationEvent {

    /**
     * @param source the bean that published the event (typically AdminService).
     */
    public ApplicationChangedEvent(Object source) {
        super(source);
    }
}
