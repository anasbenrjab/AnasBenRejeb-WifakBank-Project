package tn.esprit.wifakbankproject.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.wifakbankproject.dto.SubDepartmentDto;
import tn.esprit.wifakbankproject.entity.Department;
import tn.esprit.wifakbankproject.entity.SubDepartment;
import tn.esprit.wifakbankproject.exception.DuplicateResourceException;
import tn.esprit.wifakbankproject.exception.ResourceNotFoundException;
import tn.esprit.wifakbankproject.repository.DepartmentRepository;
import tn.esprit.wifakbankproject.repository.SubDepartmentRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SubDepartmentService {

    private final SubDepartmentRepository subDepartmentRepository;
    private final DepartmentRepository    departmentRepository;

    // ── List (admin tables + pickers) ─────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<SubDepartmentDto> findAll() {
        return subDepartmentRepository.findByDeletedFalse().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SubDepartmentDto> findByDepartmentId(Long departmentId) {
        return subDepartmentRepository.findByDepartmentIdAndDeletedFalse(departmentId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    // ── Create ────────────────────────────────────────────────────────────────

    public SubDepartmentDto create(SubDepartmentDto dto) {
        Department dept = departmentRepository.findById(dto.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));

        // Uniqueness: name must be unique within the parent department (all rows incl. deleted)
        if (subDepartmentRepository.existsByNameIgnoreCaseAndDepartmentId(
                dto.getName(), dto.getDepartmentId())) {
            throw new DuplicateResourceException(
                "Ce nom de sous-département existe déjà dans ce département.", "nom");
        }

        SubDepartment subDept = SubDepartment.builder()
                .name(dto.getName())
                .department(dept)
                .build();
        return mapToDto(subDepartmentRepository.save(subDept));
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public SubDepartmentDto update(Long id, SubDepartmentDto dto) {
        SubDepartment subDept = subDepartmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sub-department not found"));
        Department dept = departmentRepository.findById(dto.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));

        if (subDepartmentRepository.existsByNameIgnoreCaseAndDepartmentIdAndIdNot(
                dto.getName(), dto.getDepartmentId(), id)) {
            throw new DuplicateResourceException(
                "Ce nom de sous-département existe déjà dans ce département.", "nom");
        }

        subDept.setName(dto.getName());
        subDept.setDepartment(dept);
        return mapToDto(subDepartmentRepository.save(subDept));
    }

    // ── Soft-delete ───────────────────────────────────────────────────────────

    public void delete(Long id) {
        SubDepartment subDept = subDepartmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sub-department not found"));
        // Soft-delete: no cascade, no reference checks — users keep their assignment.
        subDept.setDeleted(true);
        subDepartmentRepository.save(subDept);
    }

    // ── Restore ───────────────────────────────────────────────────────────────

    public SubDepartmentDto restore(Long id) {
        SubDepartment subDept = subDepartmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sub-department not found"));
        subDept.setDeleted(false);
        return mapToDto(subDepartmentRepository.save(subDept));
    }

    // ── Mapper ────────────────────────────────────────────────────────────────

    private SubDepartmentDto mapToDto(SubDepartment subDept) {
        return SubDepartmentDto.builder()
                .id(subDept.getId())
                .name(subDept.getName())
                .departmentId(subDept.getDepartment().getId())
                .departmentName(subDept.getDepartment().getName())
                .build();
    }
}
