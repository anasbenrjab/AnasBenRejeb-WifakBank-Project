-- =============================================================================
-- V1: Restructure Roles and Applications  (final, matches JPA composite-PK entities)
--
-- Changes:
--   1. APPLICATIONS              → add DEPARTMENT_ID FK to DEPARTMENTS
--   2. APPLICATION_ROLES        (new, composite PK) → roles an application offers
--   3. USER_APPLICATION_ROLES   (new, composite PK) → replaces USER_ROLES
--   4. USER_ROLES              (old) → dropped
--
-- NOTE: APPLICATION_ROLES and USER_APPLICATION_ROLES use composite primary keys
-- (APPLICATION_ID, ROLE_ID) and (USER_ID, APPLICATION_ID, ROLE_ID) respectively,
-- matching their @Embeddable ApplicationRoleId / UserApplicationRoleId entities.
-- There is no surrogate ID column.
--
-- Existing data in USER_ROLES is intentionally NOT auto-migrated: old assignments
-- lack application context — DataInitializer re-seeds meaningful (application, role)
-- pairings in Step 3.
-- =============================================================================

-- ── 1. Add DEPARTMENT_ID FK to APPLICATIONS ─────────────────────────────────
-- An application belongs to one primary department (nullable — legacy apps
-- may not have a department assigned yet). Uses same DDL shape as USERS.department_id
-- (NUMBER(19,0) FK, no ON DELETE action, no cascade).

ALTER TABLE APPLICATIONS ADD DEPARTMENT_ID NUMBER(19,0);

ALTER TABLE APPLICATIONS ADD CONSTRAINT FK_APP_DEPARTMENT
    FOREIGN KEY (DEPARTMENT_ID) REFERENCES DEPARTMENTS (ID);

-- ── 2. Create APPLICATION_ROLES join table (composite PK) ─────────────────────
CREATE TABLE APPLICATION_ROLES (
    APPLICATION_ID NUMBER(19,0) NOT NULL,
    ROLE_ID        NUMBER(19,0) NOT NULL,
    CONSTRAINT PK_APPLICATION_ROLES PRIMARY KEY (APPLICATION_ID, ROLE_ID),
    CONSTRAINT FK_APPROLE_APPLICATION
        FOREIGN KEY (APPLICATION_ID) REFERENCES APPLICATIONS (ID) ON DELETE CASCADE,
    CONSTRAINT FK_APPROLE_ROLE
        FOREIGN KEY (ROLE_ID) REFERENCES ROLES (ID) ON DELETE CASCADE
);

CREATE INDEX IDX_APPROLE_ROLE ON APPLICATION_ROLES (ROLE_ID);

-- ── 3. Create USER_APPLICATION_ROLES join table (composite PK) ────────────────
CREATE TABLE USER_APPLICATION_ROLES (
    USER_ID        NUMBER(19,0) NOT NULL,
    APPLICATION_ID NUMBER(19,0) NOT NULL,
    ROLE_ID        NUMBER(19,0) NOT NULL,
    CONSTRAINT PK_USER_APP_ROLES PRIMARY KEY (USER_ID, APPLICATION_ID, ROLE_ID),
    CONSTRAINT FK_UAR_USER
        FOREIGN KEY (USER_ID) REFERENCES USERS (ID) ON DELETE CASCADE,
    CONSTRAINT FK_UAR_APPLICATION
        FOREIGN KEY (APPLICATION_ID) REFERENCES APPLICATIONS (ID) ON DELETE CASCADE,
    CONSTRAINT FK_UAR_ROLE
        FOREIGN KEY (ROLE_ID) REFERENCES ROLES (ID) ON DELETE CASCADE
);

CREATE INDEX IDX_UAR_APP ON USER_APPLICATION_ROLES (APPLICATION_ID);
CREATE INDEX IDX_UAR_ROLE ON USER_APPLICATION_ROLES (ROLE_ID);

-- ── 4. Drop USER_ROLES (old join table, superseded) ──────────────────────
DROP TABLE USER_ROLES;

-- =============================================================================
-- End of V1 migration
-- =============================================================================
