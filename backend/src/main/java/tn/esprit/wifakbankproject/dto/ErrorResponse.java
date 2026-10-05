package tn.esprit.wifakbankproject.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Unified error envelope returned by GlobalExceptionHandler.
 *
 * The {@code field} property is optional:
 *   - Present on 409 Conflict from DuplicateResourceException when the
 *     duplication is tied to a specific form field (e.g. "code", "nom", "url").
 *   - Omitted (null → absent from JSON) for all other errors.
 *
 * Jackson @JsonInclude(NON_NULL) ensures the field is omitted entirely when
 * null, keeping responses backwards-compatible for callers that don't know
 * about the field property.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {
    private int           status;
    private String        message;
    private LocalDateTime timestamp;
    /** Identifies which form field triggered the error. Null when not applicable. */
    private String        field;

    /** Backwards-compatible 3-arg constructor used by every existing handler site. */
    public ErrorResponse(int status, String message, LocalDateTime timestamp) {
        this.status    = status;
        this.message   = message;
        this.timestamp = timestamp;
        this.field     = null;
    }
}
