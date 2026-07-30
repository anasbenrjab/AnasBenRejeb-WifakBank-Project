package tn.esprit.wifakbankproject.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.wifakbankproject.entity.*;
import tn.esprit.wifakbankproject.repository.*;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final DepartmentRepository departmentRepository;
    private final SubDepartmentRepository subDepartmentRepository;
    private final ApplicationRepository applicationRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(String... args) {
        migrateUserStatusConstraint();
        cleanUpDuplicateUserRoles();
        if (departmentRepository.count() == 0) {
            initDepartments();
        }
        if (subDepartmentRepository.count() == 0) {
            initSubDepartments();
        }
        if (applicationRepository.count() == 0) {
            initApplications();
        }
        if (roleRepository.count() == 0) {
            initRoles();
        }
        if (userRepository.count() == 0) {
            initUsers();
        }
        boolean anyUserHasRoles = userRepository.findAll().stream().anyMatch(u -> !u.getRoles().isEmpty());
        if (!anyUserHasRoles) {
            initUserRoles();
        }
    }

    private void migrateUserStatusConstraint() {
        try {
            // Find check constraints on STATUS column of USERS table
            String findConstraintsSql =
                    "SELECT ucc.constraint_name " +
                    "FROM user_cons_columns ucc " +
                    "JOIN user_constraints uc ON ucc.constraint_name = uc.constraint_name " +
                    "WHERE ucc.table_name = 'USERS' " +
                    "  AND ucc.column_name = 'STATUS' " +
                    "  AND uc.constraint_type = 'C'";

            List<String> constraints = jdbcTemplate.queryForList(findConstraintsSql, String.class);
            for (String constraintName : constraints) {
                try {
                    jdbcTemplate.execute("ALTER TABLE USERS DROP CONSTRAINT " + constraintName);
                    System.out.println("Dropped check constraint: " + constraintName);
                } catch (Exception e) {
                    System.out.println("Could not drop constraint " + constraintName + ": " + e.getMessage());
                }
            }

            // Run updates to migrate old status strings to new ones
            jdbcTemplate.execute("UPDATE USERS SET STATUS = 'ACTIF' WHERE STATUS = 'ACTIVE'");
            jdbcTemplate.execute("UPDATE USERS SET STATUS = 'INACTIF' WHERE STATUS = 'INACTIVE'");

            // Re-add check constraint with correct values
            try {
                jdbcTemplate.execute("ALTER TABLE USERS ADD CONSTRAINT CHK_USER_STATUS CHECK (STATUS IN ('ACTIF', 'INACTIF'))");
                System.out.println("Added check constraint CHK_USER_STATUS");
            } catch (Exception e) {
                System.out.println("Could not add CHK_USER_STATUS constraint: " + e.getMessage());
            }
        } catch (Exception e) {
            System.err.println("Failed to migrate user status constraints: " + e.getMessage());
        }
    }

    private void initDepartments() {
        Department it = Department.builder().code("IT").name("Informatique").description("Département informatique").build();
        Department rh = Department.builder().code("RH").name("Ressources Humaines").description("Département RH").build();
        Department finance = Department.builder().code("FINANCE").name("Finance").description("Département finance").build();
        Department commercial = Department.builder().code("COMMERCIAL").name("Commercial").description("Département commercial").build();
        departmentRepository.saveAll(List.of(it, rh, finance, commercial));
    }

    private void initSubDepartments() {
        Department it = departmentRepository.findByCode("IT").orElseThrow();
        Department rh = departmentRepository.findByCode("RH").orElseThrow();

        SubDepartment devops = SubDepartment.builder().name("DevOps").department(it).build();
        SubDepartment data = SubDepartment.builder().name("Data").department(it).build();
        SubDepartment dev = SubDepartment.builder().name("Dev").department(it).build();
        SubDepartment qa = SubDepartment.builder().name("QA").department(it).build();
        SubDepartment recruitment = SubDepartment.builder().name("Recruitment").department(rh).build();
        SubDepartment payroll = SubDepartment.builder().name("Payroll").department(rh).build();
        subDepartmentRepository.saveAll(List.of(devops, data, dev, qa, recruitment, payroll));
    }

    private void initApplications() {
        Application doi = Application.builder().code("DOI").nom("Dématérialisation").description("Gestion documentaire dématérialisée").url("http://doi.wifakbank.tn").icon("description").authType("AD").status(Application.Status.ACTIVE).build();
        Application ged = Application.builder().code("GED").nom("GED").description("Gestion électronique des documents").url("http://ged.wifakbank.tn").icon("folder").authType("AD").status(Application.Status.ACTIVE).build();
        Application crm = Application.builder().code("CRM").nom("CRM").description("Gestion de la relation client").url("http://crm.wifakbank.tn").icon("people").authType("AD").status(Application.Status.ACTIVE).build();
        Application credit = Application.builder().code("CREDIT").nom("Crédit").description("Gestion des dossiers de crédit").url("http://credit.wifakbank.tn").icon("account_balance").authType("AD").status(Application.Status.ACTIVE).build();
        Application rhApp = Application.builder().code("RH").nom("Ressources Humaines").description("Gestion du personnel").url("http://rh.wifakbank.tn").icon("badge").authType("AD").status(Application.Status.ACTIVE).build();
        applicationRepository.saveAll(List.of(doi, ged, crm, credit, rhApp));
    }

    private void initRoles() {
        Role adminDoi = Role.builder().nom("Administrateur DOI").description("Accès complet DOI").build();
        Role consultationDoi = Role.builder().nom("Consultation DOI").description("Lecture seule DOI").build();
        Role adminGed = Role.builder().nom("Administrateur GED").description("Accès complet GED").build();
        Role consultationGed = Role.builder().nom("Consultation GED").description("Lecture seule GED").build();
        Role adminCrm = Role.builder().nom("Administrateur CRM").description("Accès complet CRM").build();
        Role consultationCrm = Role.builder().nom("Consultation CRM").description("Lecture seule CRM").build();
        Role adminCredit = Role.builder().nom("Administrateur CREDIT").description("Accès complet Crédit").build();
        Role validationCredit = Role.builder().nom("Validation CREDIT").description("Validation des dossiers Crédit").build();
        Role consultationCredit = Role.builder().nom("Consultation CREDIT").description("Lecture seule Crédit").build();
        Role responsableRh = Role.builder().nom("Responsable RH").description("Gestion complète RH").build();
        Role consultationRh = Role.builder().nom("Consultation RH").description("Lecture seule RH").build();
        roleRepository.saveAll(List.of(adminDoi, consultationDoi, adminGed, consultationGed, adminCrm, consultationCrm, adminCredit, validationCredit, consultationCredit, responsableRh, consultationRh));
    }

    private void initUsers() {
        Department it = departmentRepository.findByCode("IT").orElseThrow();
        Department finance = departmentRepository.findByCode("FINANCE").orElseThrow();
        SubDepartment devops = subDepartmentRepository.findByDepartmentId(it.getId()).stream().findFirst().orElseThrow();

        User admin = User.builder().login("admin").nom("Admin").prenom("Système").email("admin@wifakbank.tn").authType(User.AuthType.AD).status(UserStatus.ACTIF).createdAt(LocalDateTime.now()).department(it).subDepartment(devops).build();
        User ahmed = User.builder().login("ahmed").nom("Ben Ali").prenom("Ahmed").email("ahmed@wifakbank.tn").authType(User.AuthType.AD).status(UserStatus.ACTIF).createdAt(LocalDateTime.now()).department(finance).build();
        userRepository.saveAll(List.of(admin, ahmed));
    }

    private void initUserRoles() {
        User admin = userRepository.findByLogin("admin").orElseThrow();
        User ahmed = userRepository.findByLogin("ahmed").orElseThrow();

        Role validationCredit = roleRepository.findByNom("Validation CREDIT").orElseThrow();
        Role consultationRh = roleRepository.findByNom("Consultation RH").orElseThrow();
        Role adminGed = roleRepository.findByNom("Administrateur GED").orElseThrow();
        Role adminDoi = roleRepository.findByNom("Administrateur DOI").orElseThrow();
        Role adminCrm = roleRepository.findByNom("Administrateur CRM").orElseThrow();
        Role adminCredit = roleRepository.findByNom("Administrateur CREDIT").orElseThrow();
        Role responsableRh = roleRepository.findByNom("Responsable RH").orElseThrow();

        ahmed.getRoles().addAll(List.of(validationCredit, consultationRh, adminGed));
        admin.getRoles().addAll(List.of(adminDoi, adminGed, adminCrm, adminCredit, responsableRh));
        userRepository.saveAll(List.of(admin, ahmed));
    }

    private void cleanUpDuplicateUserRoles() {
        try {
            // Clean up any duplicate role assignments in USER_ROLES table (keep one) using ROWID
            jdbcTemplate.execute(
                "DELETE FROM USER_ROLES " +
                "WHERE ROWID NOT IN (" +
                "    SELECT MIN(ROWID) " +
                "    FROM USER_ROLES " +
                "    GROUP BY USER_ID, ROLE_ID" +
                ")"
            );
            System.out.println("Successfully cleaned up duplicate user role assignments.");
        } catch (Exception e) {
            System.out.println("No duplicates cleaned or error occurred: " + e.getMessage());
        }
    }
}
