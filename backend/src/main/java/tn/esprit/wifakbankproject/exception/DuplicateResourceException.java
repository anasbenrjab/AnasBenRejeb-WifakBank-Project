package tn.esprit.wifakbankproject.exception;

/**
 * Thrown when a create/update operation would violate a uniqueness rule.
 *
 * The optional {@code field} property names the form field responsible for
 * the conflict (e.g. "code", "nom", "url").  It is forwarded to the HTTP
 * response body by {@link GlobalExceptionHandler} so the frontend can
 * highlight the exact field without parsing the message string.
 *
 * Constructors:
 *   DuplicateResourceException(message)        — field = null (backwards compat)
 *   DuplicateResourceException(message, field) — field set
 */
public class DuplicateResourceException extends RuntimeException {

    private final String field;

    /** Backwards-compatible: no field context (existing callers unchanged). */
    public DuplicateResourceException(String message) {
        super(message);
        this.field = null;
    }

    /** Field-aware: use when the duplication maps to a specific form field. */
    public DuplicateResourceException(String message, String field) {
        super(message);
        this.field = field;
    }

    public String getField() {
        return field;
    }
}
