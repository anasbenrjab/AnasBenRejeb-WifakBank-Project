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
    private final ApplicationRoleRepository applicationRoleRepository;
    private final UserApplicationRoleRepository userApplicationRoleRepository;
    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(String... args) {
        migrateUserStatusConstraint();
        cleanUpDuplicateUserApplicationRoles();
        if (departmentRepository.count() == 0) {
            initDepartments();
        }
        if (subDepartmentRepository.count() == 0) {
            initSubDepartments();
        }
        initApplications();
        initRoles();
        initUsers();
        if (applicationRoleRepository.count() == 0) {
            initApplicationRoles();
        }
        boolean anyUserHasApplicationRoles = userApplicationRoleRepository.count() > 0;
        if (!anyUserHasApplicationRoles) {
            initUserApplicationRoles();
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
        Department it = departmentRepository.findByCode("IT").orElse(null);
        Department rh = departmentRepository.findByCode("RH").orElse(null);
        Department finance = departmentRepository.findByCode("FINANCE").orElse(null);
        Department commercial = departmentRepository.findByCode("COMMERCIAL").orElse(null);

        applicationRepository.findByCode("DOI").orElseGet(() ->
            // TEMPORARY TEST URL — replace with http://doi.wifakbank.tn once the
            // intranet server's X-Frame-Options / frame-ancestors CSP headers are
            // confirmed to allow framing from this app's origin.
            applicationRepository.save(Application.builder().code("DOI").nom("Dématérialisation").description("Gestion documentaire dématérialisée").url("https://en.wikipedia.org/wiki/Angular_(web_framework)").icon("description").authType("AD").status(Application.Status.ACTIVE).department(it).build()));
        applicationRepository.findByCode("GED").orElseGet(() ->
            applicationRepository.save(Application.builder().code("GED").nom("GED").description("Gestion électronique des documents").url("http://ged.wifakbank.tn").icon("folder").authType("AD").status(Application.Status.ACTIVE).department(it).build()));
        applicationRepository.findByCode("CRM").orElseGet(() ->
            applicationRepository.save(Application.builder().code("CRM").nom("CRM").description("Gestion de la relation client").url("http://crm.wifakbank.tn").icon("people").authType("AD").status(Application.Status.ACTIVE).department(commercial).build()));
        applicationRepository.findByCode("CREDIT").orElseGet(() ->
            applicationRepository.save(Application.builder().code("CREDIT").nom("Crédit").description("Gestion des dossiers de crédit").url("http://credit.wifakbank.tn").icon("account_balance").authType("AD").status(Application.Status.ACTIVE).department(finance).build()));
        applicationRepository.findByCode("RH").orElseGet(() ->
            applicationRepository.save(Application.builder().code("RH").nom("Ressources Humaines").description("Gestion du personnel").url("http://rh.wifakbank.tn").icon("badge").authType("AD").status(Application.Status.ACTIVE).department(rh).build()));
        applicationRepository.findByCode("SYSTEM").orElseGet(() ->
            applicationRepository.save(Application.builder().code("SYSTEM").nom("Admin Portal").description("Portail d'administration Wifak Bank").icon("shield-lock").authType("AD").status(Application.Status.ACTIVE).department(it).build()));
    }

    private void initRoles() {
        roleRepository.findByNom("Administrateur DOI").orElseGet(() ->
            roleRepository.save(Role.builder().nom("Administrateur DOI").description("Accès complet DOI").build()));
        roleRepository.findByNom("Consultation DOI").orElseGet(() ->
            roleRepository.save(Role.builder().nom("Consultation DOI").description("Lecture seule DOI").build()));
        roleRepository.findByNom("Administrateur GED").orElseGet(() ->
            roleRepository.save(Role.builder().nom("Administrateur GED").description("Accès complet GED").build()));
        roleRepository.findByNom("Consultation GED").orElseGet(() ->
            roleRepository.save(Role.builder().nom("Consultation GED").description("Lecture seule GED").build()));
        roleRepository.findByNom("Administrateur CRM").orElseGet(() ->
            roleRepository.save(Role.builder().nom("Administrateur CRM").description("Accès complet CRM").build()));
        roleRepository.findByNom("Consultation CRM").orElseGet(() ->
            roleRepository.save(Role.builder().nom("Consultation CRM").description("Lecture seule CRM").build()));
        roleRepository.findByNom("Administrateur CREDIT").orElseGet(() ->
            roleRepository.save(Role.builder().nom("Administrateur CREDIT").description("Accès complet Crédit").build()));
        roleRepository.findByNom("Validation CREDIT").orElseGet(() ->
            roleRepository.save(Role.builder().nom("Validation CREDIT").description("Validation des dossiers Crédit").build()));
        roleRepository.findByNom("Consultation CREDIT").orElseGet(() ->
            roleRepository.save(Role.builder().nom("Consultation CREDIT").description("Lecture seule Crédit").build()));
        roleRepository.findByNom("Responsable RH").orElseGet(() ->
            roleRepository.save(Role.builder().nom("Responsable RH").description("Gestion complète RH").build()));
        roleRepository.findByNom("Consultation RH").orElseGet(() ->
            roleRepository.save(Role.builder().nom("Consultation RH").description("Lecture seule RH").build()));
        roleRepository.findByNom("ROLE_ADMIN").orElseGet(() ->
            roleRepository.save(Role.builder().nom("ROLE_ADMIN").description("Accès global au portail d'administration").build()));
    }

    private void initUsers() {
        Department it = departmentRepository.findByCode("IT").orElseThrow();
        Department finance = departmentRepository.findByCode("FINANCE").orElseThrow();
        SubDepartment devops = subDepartmentRepository.findByDepartmentId(it.getId()).stream().findFirst().orElseThrow();

        userRepository.findByLogin("admin").orElseGet(() ->
            userRepository.save(User.builder().login("admin").nom("Admin").prenom("Système").email("admin@wifakbank.tn").authType(User.AuthType.AD).status(UserStatus.ACTIF).createdAt(LocalDateTime.now()).department(it).subDepartment(devops).build()));
        userRepository.findByLogin("ahmed").orElseGet(() ->
            userRepository.save(User.builder().login("ahmed").nom("Ben Ali").prenom("Ahmed").email("ahmed@wifakbank.tn").authType(User.AuthType.AD).status(UserStatus.ACTIF).createdAt(LocalDateTime.now()).department(finance).build()));
    }

    private void initUserApplicationRoles() {
        User admin = userRepository.findByLogin("admin").orElseThrow();
        User ahmed = userRepository.findByLogin("ahmed").orElseThrow();

        Application doi = applicationRepository.findByCode("DOI").orElseThrow();
        Application ged = applicationRepository.findByCode("GED").orElseThrow();
        Application crm = applicationRepository.findByCode("CRM").orElseThrow();
        Application credit = applicationRepository.findByCode("CREDIT").orElseThrow();
        Application rhApp = applicationRepository.findByCode("RH").orElseThrow();
        Application systemApp = applicationRepository.findByCode("SYSTEM").orElseThrow();

        Role validationCredit = roleRepository.findByNom("Validation CREDIT").orElseThrow();
        Role consultationRh = roleRepository.findByNom("Consultation RH").orElseThrow();
        Role adminGed = roleRepository.findByNom("Administrateur GED").orElseThrow();
        Role adminDoi = roleRepository.findByNom("Administrateur DOI").orElseThrow();
        Role adminCrm = roleRepository.findByNom("Administrateur CRM").orElseThrow();
        Role adminCredit = roleRepository.findByNom("Administrateur CREDIT").orElseThrow();
        Role responsableRh = roleRepository.findByNom("Responsable RH").orElseThrow();
        Role systemAdminRole = roleRepository.findByNom("ROLE_ADMIN").orElseThrow();

        userApplicationRoleRepository.saveAll(List.of(
                UserApplicationRole.builder().user(ahmed).application(credit).role(validationCredit).build(),
                UserApplicationRole.builder().user(ahmed).application(rhApp).role(consultationRh).build(),
                UserApplicationRole.builder().user(ahmed).application(ged).role(adminGed).build(),

                UserApplicationRole.builder().user(admin).application(doi).role(adminDoi).build(),
                UserApplicationRole.builder().user(admin).application(ged).role(adminGed).build(),
                UserApplicationRole.builder().user(admin).application(crm).role(adminCrm).build(),
                UserApplicationRole.builder().user(admin).application(credit).role(adminCredit).build(),
                UserApplicationRole.builder().user(admin).application(rhApp).role(responsableRh).build(),
                UserApplicationRole.builder().user(admin).application(systemApp).role(systemAdminRole).build()
        ));
    }

    private void initApplicationRoles() {
        Application doi = applicationRepository.findByCode("DOI").orElseThrow();
        Application ged = applicationRepository.findByCode("GED").orElseThrow();
        Application crm = applicationRepository.findByCode("CRM").orElseThrow();
        Application credit = applicationRepository.findByCode("CREDIT").orElseThrow();
        Application rhApp = applicationRepository.findByCode("RH").orElseThrow();
        Application systemApp = applicationRepository.findByCode("SYSTEM").orElseThrow();

        Role adminDoi = roleRepository.findByNom("Administrateur DOI").orElseThrow();
        Role consultationDoi = roleRepository.findByNom("Consultation DOI").orElseThrow();
        Role adminGed = roleRepository.findByNom("Administrateur GED").orElseThrow();
        Role consultationGed = roleRepository.findByNom("Consultation GED").orElseThrow();
        Role adminCrm = roleRepository.findByNom("Administrateur CRM").orElseThrow();
        Role consultationCrm = roleRepository.findByNom("Consultation CRM").orElseThrow();
        Role adminCredit = roleRepository.findByNom("Administrateur CREDIT").orElseThrow();
        Role validationCredit = roleRepository.findByNom("Validation CREDIT").orElseThrow();
        Role consultationCredit = roleRepository.findByNom("Consultation CREDIT").orElseThrow();
        Role responsableRh = roleRepository.findByNom("Responsable RH").orElseThrow();
        Role consultationRh = roleRepository.findByNom("Consultation RH").orElseThrow();
        Role systemAdminRole = roleRepository.findByNom("ROLE_ADMIN").orElseThrow();

        applicationRoleRepository.saveAll(List.of(
                ApplicationRole.builder().application(doi).role(adminDoi).build(),
                ApplicationRole.builder().application(doi).role(consultationDoi).build(),

                ApplicationRole.builder().application(ged).role(adminGed).build(),
                ApplicationRole.builder().application(ged).role(consultationGed).build(),

                ApplicationRole.builder().application(crm).role(adminCrm).build(),
                ApplicationRole.builder().application(crm).role(consultationCrm).build(),

                ApplicationRole.builder().application(credit).role(adminCredit).build(),
                ApplicationRole.builder().application(credit).role(validationCredit).build(),
                ApplicationRole.builder().application(credit).role(consultationCredit).build(),

                ApplicationRole.builder().application(rhApp).role(responsableRh).build(),
                ApplicationRole.builder().application(rhApp).role(consultationRh).build(),

                ApplicationRole.builder().application(systemApp).role(systemAdminRole).build()
        ));
    }

    private void cleanUpDuplicateUserApplicationRoles() {
        try {
            jdbcTemplate.execute(
                "DELETE FROM USER_APPLICATION_ROLES " +
                "WHERE ROWID NOT IN (" +
                "    SELECT MIN(ROWID) " +
                "    FROM USER_APPLICATION_ROLES " +
                "    GROUP BY USER_ID, APPLICATION_ID, ROLE_ID" +
                ")"
            );
            System.out.println("Successfully cleaned up duplicate user-application-role assignments.");
        } catch (Exception e) {
            System.out.println("No duplicates cleaned or error occurred: " + e.getMessage());
        }
    }
}
