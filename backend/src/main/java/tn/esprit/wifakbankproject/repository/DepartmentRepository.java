package tn.esprit.wifakbankproject.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.wifakbankproject.entity.Department;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
}
