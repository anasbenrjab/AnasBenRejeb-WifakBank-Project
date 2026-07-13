-- =============================================================================
-- Seed data – Oracle-compatible MERGE INTO … USING dual (idempotent)
-- =============================================================================

-- ── APPLICATIONS ─────────────────────────────────────────────────────────────

MERGE INTO APPLICATIONS a
USING dual ON (a.CODE = 'DOI')
WHEN NOT MATCHED THEN INSERT (ID, CODE, NOM, DESCRIPTION, URL, ICON, AUTH_TYPE, STATUS)
  VALUES (1, 'DOI', 'Dématérialisation', 'Gestion documentaire dématérialisée', 'http://doi.wifakbank.tn', 'description', 'AD', 'ACTIVE');

MERGE INTO APPLICATIONS a
USING dual ON (a.CODE = 'GED')
WHEN NOT MATCHED THEN INSERT (ID, CODE, NOM, DESCRIPTION, URL, ICON, AUTH_TYPE, STATUS)
  VALUES (2, 'GED', 'GED', 'Gestion électronique des documents', 'http://ged.wifakbank.tn', 'folder', 'AD', 'ACTIVE');

MERGE INTO APPLICATIONS a
USING dual ON (a.CODE = 'CRM')
WHEN NOT MATCHED THEN INSERT (ID, CODE, NOM, DESCRIPTION, URL, ICON, AUTH_TYPE, STATUS)
  VALUES (3, 'CRM', 'CRM', 'Gestion de la relation client', 'http://crm.wifakbank.tn', 'people', 'AD', 'ACTIVE');

MERGE INTO APPLICATIONS a
USING dual ON (a.CODE = 'CREDIT')
WHEN NOT MATCHED THEN INSERT (ID, CODE, NOM, DESCRIPTION, URL, ICON, AUTH_TYPE, STATUS)
  VALUES (4, 'CREDIT', 'Crédit', 'Gestion des dossiers de crédit', 'http://credit.wifakbank.tn', 'account_balance', 'AD', 'ACTIVE');

MERGE INTO APPLICATIONS a
USING dual ON (a.CODE = 'RH')
WHEN NOT MATCHED THEN INSERT (ID, CODE, NOM, DESCRIPTION, URL, ICON, AUTH_TYPE, STATUS)
  VALUES (5, 'RH', 'Ressources Humaines', 'Gestion du personnel', 'http://rh.wifakbank.tn', 'badge', 'AD', 'ACTIVE');

-- ── ROLES ────────────────────────────────────────────────────────────────────

-- DOI roles
MERGE INTO ROLES r
USING dual ON (r.ID = 1)
WHEN NOT MATCHED THEN INSERT (ID, APPLICATION_ID, NOM, DESCRIPTION)
  VALUES (1, 1, 'Administrateur DOI', 'Accès complet DOI');

MERGE INTO ROLES r
USING dual ON (r.ID = 2)
WHEN NOT MATCHED THEN INSERT (ID, APPLICATION_ID, NOM, DESCRIPTION)
  VALUES (2, 1, 'Consultation DOI', 'Lecture seule DOI');

-- GED roles
MERGE INTO ROLES r
USING dual ON (r.ID = 3)
WHEN NOT MATCHED THEN INSERT (ID, APPLICATION_ID, NOM, DESCRIPTION)
  VALUES (3, 2, 'Administrateur GED', 'Accès complet GED');

MERGE INTO ROLES r
USING dual ON (r.ID = 4)
WHEN NOT MATCHED THEN INSERT (ID, APPLICATION_ID, NOM, DESCRIPTION)
  VALUES (4, 2, 'Consultation GED', 'Lecture seule GED');

-- CRM roles
MERGE INTO ROLES r
USING dual ON (r.ID = 5)
WHEN NOT MATCHED THEN INSERT (ID, APPLICATION_ID, NOM, DESCRIPTION)
  VALUES (5, 3, 'Administrateur CRM', 'Accès complet CRM');

MERGE INTO ROLES r
USING dual ON (r.ID = 6)
WHEN NOT MATCHED THEN INSERT (ID, APPLICATION_ID, NOM, DESCRIPTION)
  VALUES (6, 3, 'Consultation CRM', 'Lecture seule CRM');

-- CREDIT roles
MERGE INTO ROLES r
USING dual ON (r.ID = 7)
WHEN NOT MATCHED THEN INSERT (ID, APPLICATION_ID, NOM, DESCRIPTION)
  VALUES (7, 4, 'Administrateur CREDIT', 'Accès complet Crédit');

MERGE INTO ROLES r
USING dual ON (r.ID = 8)
WHEN NOT MATCHED THEN INSERT (ID, APPLICATION_ID, NOM, DESCRIPTION)
  VALUES (8, 4, 'Validation CREDIT', 'Validation des dossiers Crédit');

MERGE INTO ROLES r
USING dual ON (r.ID = 9)
WHEN NOT MATCHED THEN INSERT (ID, APPLICATION_ID, NOM, DESCRIPTION)
  VALUES (9, 4, 'Consultation CREDIT', 'Lecture seule Crédit');

-- RH roles
MERGE INTO ROLES r
USING dual ON (r.ID = 10)
WHEN NOT MATCHED THEN INSERT (ID, APPLICATION_ID, NOM, DESCRIPTION)
  VALUES (10, 5, 'Responsable RH', 'Gestion complète RH');

MERGE INTO ROLES r
USING dual ON (r.ID = 11)
WHEN NOT MATCHED THEN INSERT (ID, APPLICATION_ID, NOM, DESCRIPTION)
  VALUES (11, 5, 'Consultation RH', 'Lecture seule RH');

-- ── USERS (admin + ahmed – JIT will also create them on first login) ──────────

MERGE INTO USERS u
USING dual ON (u.LOGIN = 'admin')
WHEN NOT MATCHED THEN INSERT (ID, LOGIN, NOM, PRENOM, EMAIL, AUTH_TYPE, STATUS, CREATED_AT)
  VALUES (1, 'admin', 'Admin', 'Système', 'admin@wifakbank.tn', 'AD', 'ACTIVE', SYSTIMESTAMP);

MERGE INTO USERS u
USING dual ON (u.LOGIN = 'ahmed')
WHEN NOT MATCHED THEN INSERT (ID, LOGIN, NOM, PRENOM, EMAIL, AUTH_TYPE, STATUS, CREATED_AT)
  VALUES (2, 'ahmed', 'Ben Ali', 'Ahmed', 'ahmed@wifakbank.tn', 'AD', 'ACTIVE', SYSTIMESTAMP);

-- ── USER_ROLES for ahmed: CREDIT/Validation, RH/Consultation, GED/Administrateur

MERGE INTO USER_ROLES ur
USING dual ON (ur.USER_ID = 2 AND ur.ROLE_ID = 8)
WHEN NOT MATCHED THEN INSERT (ID, USER_ID, ROLE_ID) VALUES (1, 2, 8);

MERGE INTO USER_ROLES ur
USING dual ON (ur.USER_ID = 2 AND ur.ROLE_ID = 11)
WHEN NOT MATCHED THEN INSERT (ID, USER_ID, ROLE_ID) VALUES (2, 2, 11);

MERGE INTO USER_ROLES ur
USING dual ON (ur.USER_ID = 2 AND ur.ROLE_ID = 3)
WHEN NOT MATCHED THEN INSERT (ID, USER_ID, ROLE_ID) VALUES (3, 2, 3);

-- admin gets all roles on all apps
MERGE INTO USER_ROLES ur
USING dual ON (ur.USER_ID = 1 AND ur.ROLE_ID = 1)
WHEN NOT MATCHED THEN INSERT (ID, USER_ID, ROLE_ID) VALUES (4, 1, 1);

MERGE INTO USER_ROLES ur
USING dual ON (ur.USER_ID = 1 AND ur.ROLE_ID = 3)
WHEN NOT MATCHED THEN INSERT (ID, USER_ID, ROLE_ID) VALUES (5, 1, 3);

MERGE INTO USER_ROLES ur
USING dual ON (ur.USER_ID = 1 AND ur.ROLE_ID = 5)
WHEN NOT MATCHED THEN INSERT (ID, USER_ID, ROLE_ID) VALUES (6, 1, 5);

MERGE INTO USER_ROLES ur
USING dual ON (ur.USER_ID = 1 AND ur.ROLE_ID = 7)
WHEN NOT MATCHED THEN INSERT (ID, USER_ID, ROLE_ID) VALUES (7, 1, 7);

MERGE INTO USER_ROLES ur
USING dual ON (ur.USER_ID = 1 AND ur.ROLE_ID = 10)
WHEN NOT MATCHED THEN INSERT (ID, USER_ID, ROLE_ID) VALUES (8, 1, 10);
